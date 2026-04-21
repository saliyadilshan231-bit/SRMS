from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
from logic import get_feedback

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'gpa_model.pkl'
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None
    print(f"Warning: {MODEL_PATH} not found. Run train_model.py first.")

@app.route('/api/feedback', methods=['POST'])
def feedback():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    if not data or 'semester_gpa' not in data or 'overall_gpa' not in data:
        return jsonify({"error": "Missing required GPA payloads"}), 400

    try:
        semester_gpa = float(data['semester_gpa'])
        overall_gpa = float(data['overall_gpa'])
        year = data.get('year', '1st Year')
        semester = data.get('semester', 'Semester 1')
        modules = data.get('modules', [])

        # Predict tier for semester
        sem_tier = model.predict([[semester_gpa]])[0]
        # Predict tier for overall year
        overall_tier = model.predict([[overall_gpa]])[0]

        semester_message = get_feedback(sem_tier, year, semester, modules, is_overall=False)
        overall_message = get_feedback(overall_tier, year, is_overall=True)

        return jsonify({
            "semester_feedback": semester_message,
            "overall_feedback": overall_message,
            "semester_tier": int(sem_tier),
            "overall_tier": int(overall_tier)
        })

    except ValueError:
        return jsonify({"error": "Invalid GPA values"}), 400

if __name__ == '__main__':
    # Run on 0.0.0.0 to allow mobile devices on the network to access it
    app.run(host='0.0.0.0', port=5000, debug=True)
