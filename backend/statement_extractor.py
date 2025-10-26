from dataclasses import dataclass
from typing import List
from youtube_transcript_api import YouTubeTranscriptApi
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from openai import OpenAI
import re
import json
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Statement:
    text: str
    timestamp: str


"""
Given YouTube video, extract Statements. We want to extract meaningful
blocks of information from the video. For example:

"I like cats and I like dogs" -> "I like cats", "I like dogs"

We should request the transcript with timestamps, and maintain them in the
final statements.
"""
def video(video_id):
    # Fetch transcript using the new API
    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id)
    full_transcript = " ".join([entry.text for entry in transcript])
    # Process transcript: separate sentences & keep timestamps

    data = []

    for entry in transcript:
        text = entry.text
        timestamp = entry.start
        time = str(int(timestamp // 60)) + ":" + str(round(timestamp % 60))
        data.append((time, text))
    # print(data)
    return data

def extract_statements(youtube_video_url: str) -> List[Statement]:
    video_id = youtube_video_url.split("v=")[1]
    ls = video(video_id)
    # print(ls)
    # print("-------")
    str = ""
    for i in range(len(ls)):
        str = str + ls[i][1] + " "
    # print(str)
    # print("-------")
    # Use LLM to extract factual statements

    # Initialize LLM
    client = OpenAI()
    
    response = client.chat.completions.create(
        model="gpt-4o",
        # messages=[
        #     {"role": "system", "content": "You are an expert at extracting factual statements from text."},
        #     {"role": "user", "content": f"Extract all statements and assertions from this transcript. Return each one exactly as written, along with a clarified version if needed. The output should be a list where each item contains:\n1. 'Original': the extracted statement\n2. 'Clarified': the statement with missing context added for better understanding, if needed. If no clarification is needed, keep it the same.\n\nNow extract statements from this transcript: {str}"}
        # ],
        messages=[
            {"role": "system", "content": "You are an expert at extracting the MOST controversial, confusing or dubious statements from text that require fact-checking."},
            {"role": "user", "content": f"""
            Extract the **TOP 10-15 most controversial, confusing or dubious statements** from this transcript that most urgently need fact-checking.
            
            Prioritize statements that:
            - Make specific factual claims that can be verified
            - Are controversial, inflammatory, or divisive
            - Could spread misinformation if false
            
            The output should be a structured list where each item contains:
            1. **'Original'**: The exact extracted statement.
            2. **'Clarified'**: The statement with missing context added for better understanding. If no clarification is needed, keep it the same. The clarified statement should contain enough information by itself to evaluate it.

            **Rules:**
            - Focus on the MOST important and controversial statements only
            - Avoid extracting minor or trivial statements
            - Prioritize claims that can be fact-checked
            - If the statement lacks context, **add minimal necessary clarification** in the 'Clarified' field

            Now extract the top statements from this transcript:
            {str}
            """}
        ],
        functions=[{
            "name": "extract_statements",
            "description": "Extracts factual statements from text and clarifies them if needed",
            "parameters": {
                "type": "object",
                "properties": {
                    "statements": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "original": {
                                    "type": "string",
                                    "description": "The exact extracted factual statement"
                                },
                                "clarified": {
                                    "type": "string",
                                    "description": "A clarified version of the statement with missing context added, or the same as 'original' if no clarification is needed"
                                }
                            },
                            "required": ["original", "clarified"]
                        }
                    }
                },
                "required": ["statements"]
            }
        }],
        function_call={"name": "extract_statements"}
    )

    #get statements from LLM response
    function_call_response = response.choices[0].message.function_call.arguments
    result = json.loads(function_call_response)
    statements_text = [statement["original"] for statement in result["statements"]]
    statements_clarified = [statement["clarified"] for statement in result["statements"]]

    sentences = statements_text

    seen = set()
    unique_statements = []
    statements_with_positions = []
    for s in sentences:
        if s not in seen:
            seen.add(s)
            unique_statements.append(s)
            pos = str.find(s)
            statements_with_positions.append((s, pos))

    statements_with_positions.sort(key=lambda x: x[1])
    
    # Cap at 10 statements maximum
    statements_with_positions = statements_with_positions[:15]
    statements_clarified = statements_clarified[:15]
    
    acc = ""
    statements_with_timestamps = []
    id = 0

    for QwQ in ls:
        acc = acc + QwQ[1] + " "
        if statements_with_positions[id][1] == -1:
            id += 1 
            if (id == len(statements_with_positions)):
                break
        if (len(acc) > statements_with_positions[id][1]):
            statements_with_timestamps.append(Statement(statements_clarified[id], QwQ[0]))
            id += 1
            if (id == len(statements_with_positions)):
                break
    print(statements_with_timestamps)
    return statements_with_timestamps

if __name__ == "__main__":
    extract_statements("https://www.youtube.com/watch?v=ShRYdYTtIx8")
