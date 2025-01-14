from io import BytesIO
from flask import Flask, request, jsonify
from PIL import Image
import base64
from flask_cors import CORS
from groq import Groq
import os
from dotenv import load_dotenv
import tempfile

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
# Initialize Groq client
client = Groq(api_key=Groq_API)

# Constants
LLAMA_3_2_VISION_11B = 'llama-3.2-90b-vision-preview'
LLAMA32_MODEL = 'llama-3.2-3b-preview'

def encode_image(image):
    """Encode image to base64 in JPEG format."""
    buffer = BytesIO()
    # Ensure the image is converted to RGB mode if necessary (JPEG doesn't support alpha channels)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    image.save(buffer, format='JPEG')  # Save the image as JPEG
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')

def image_to_text(client, model, base64_image, prompt):
    """Convert image to text using Groq API"""
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            }
        ],
        model=model
    )
    return chat_completion.choices[0].message.content

def document_analysis_generation(client, image_description):
    """Generate document analysis for PII detection"""
    chat_completion = client.chat.completions.create(   
        messages=[
            {
                "role": "system",
                "content": "Give me a Output which explains about the text if it has Personally Identifiable Information (PII) give it in the output and write No PII Detected as output",
            },
            {
                "role": "user",
                "content": image_description,
            }
        ],
        model=LLAMA32_MODEL
    )
    return chat_completion.choices[0].message.content

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """Endpoint to analyze image for PII."""
    try:
        # Check if image file is present in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        # Get image file and prompt
        image_file = request.files['image']
        prompt = request.form.get('prompt', 'Describe this image')

        # Load and process image
        image = Image.open(image_file)

        # Convert image to base64 (ensures it's in JPEG format)
        base64_image = encode_image(image)

        # Get image description
        image_description = image_to_text(
            client, 
            LLAMA_3_2_VISION_11B, 
            base64_image, 
            prompt
        )

        # Generate analysis
        analysis = document_analysis_generation(client, image_description)

        # Prepare response
        response = {
            'image_description': image_description.strip(),  # Stripped description for better formatting
            'privacy_analysis': analysis.strip(),  # Stripped analysis for better formatting
            'pii_detected': not (
                "No PII Detected" in analysis or 
                "No Personal Identifiable Information Found" in analysis or 
                "No Sensitive Information Detected" in analysis
            )
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True)
