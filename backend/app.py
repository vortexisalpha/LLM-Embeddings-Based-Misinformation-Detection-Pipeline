from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_caching import Cache
import os
from dotenv import load_dotenv
from urllib.parse import unquote

from main import get_app_data, AppData

app = Flask(__name__)
CORS(app)

app_data: AppData = None

# Configure cache
# ma
cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(cache_dir, exist_ok=True)

# Stores results of functions in filesystem for 5 minutes
cache = Cache(app, config={
    'CACHE_TYPE': 'filesystem',
    'CACHE_DIR': cache_dir,
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes
})

#set open ai key
load_dotenv()  # load .env file
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


#VIDEO LINK ENDPOINT
@app.route('/misinformation/<path:youtube_url>')
@cache.cached(timeout=0)  # cache indefinitely - results won't change for same video
def get_misinformation(youtube_url: str):  
    global app_data
    decoded_url = unquote(youtube_url)
    app_data = get_app_data(decoded_url)
    return jsonify(app_data.misinformation_graph)


#LEVEL 2 ENDPOINT
@app.route("/statement/<int:misinformation_id>")
@cache.cached(timeout=0)
def get_statements(misinformation_id: int):
    return jsonify(app_data.statement_graphs[misinformation_id])

#LEVEL 3 ENDPOINT
@app.route("/provenance/<int:statement_id>")
@cache.cached(timeout=0)
def get_provenance(statement_id: int):
    return jsonify(app_data.article_dagraph[statement_id])


#metadata endpoints
@app.route("/video_url")
@cache.cached(timeout=0)
def get_video_url():
    if app_data:
        return jsonify({"url": app_data.url})
    return jsonify({"url": ""})


@app.route("/lvl_2_title")
@cache.cached(timeout=0)
def get_title():
    if app_data:
        return jsonify({"header": "YouTube Video Analysis"})
    return jsonify({"header": ""})


if __name__ == '__main__':
    app.run(debug=True)
