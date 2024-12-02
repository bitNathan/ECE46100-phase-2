from flask import Flask, request, jsonify
import openai

# Initialize Flask app
app = Flask(__name__)

# Configure OpenAI API key
openai.api_key = "your_openai_api_key"

# Example function to get package popularity (e.g., npm data)
def get_package_popularity(package_name):
    # Use the npm registry API to fetch download stats
    response = requests.get(f"https://api.npmjs.org/downloads/point/last-month/{package_name}")
    if response.status_code == 200:
        data = response.json()
        return data.get("downloads", 0)
    return 0

# Recommend endpoint
@app.route("/recommend", methods=["POST"])
def recommend_packages():
    # Get description from request
    description = request.json.get("description", "")
    if not description:
        return jsonify({"error": "Description is required"}), 400

    try:
        # Call OpenAI API
        prompt = f"Recommend 5 npm packages based on the following description:\n\n{description}"
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=100,
            temperature=0.7
        )
        suggestions = response.choices[0].text.strip().split("\n")
        
        # Clean and validate suggestions
        packages = []
        for suggestion in suggestions:
            package_name = suggestion.strip()
            popularity = get_package_popularity(package_name)
            packages.append({"name": package_name, "popularity": popularity})
        
        # Sort by popularity and return the top 5
        top_packages = sorted(packages, key=lambda x: x["popularity"], reverse=True)[:5]
        return jsonify({"description": description, "recommendations": top_packages})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
