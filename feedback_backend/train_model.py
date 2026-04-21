import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

def generate_synthetic_data(num_samples=1000):
    # Generate random GPAs between 0.0 and 4.0
    np.random.seed(42)
    gpas = np.random.uniform(0.0, 4.0, num_samples)
    
    # Define Tiers based on GPA:
    # Tier 0 (Critical): <= 1.5
    # Tier 1 (Needs Improvement): 1.5 < GPA <= 2.5
    # Tier 2 (Good): 2.5 < GPA <= 3.5
    # Tier 3 (Excellent): > 3.5
    
    tiers = []
    for gpa in gpas:
        if gpa <= 1.5:
            tiers.append(0)
        elif gpa <= 2.5:
            tiers.append(1)
        elif gpa <= 3.5:
            tiers.append(2)
        else:
            tiers.append(3)
            
    df = pd.DataFrame({'GPA': gpas, 'Tier': tiers})
    return df

def train_and_save():
    print("Generating synthetic data...")
    data = generate_synthetic_data(2000)
    
    X = data[['GPA']]
    y = data['Tier']
    
    print("Training Decision Tree Model...")
    model = DecisionTreeClassifier(max_depth=3, random_state=42)
    model.fit(X, y)
    
    print("Saving model to gpa_model.pkl...")
    joblib.dump(model, 'gpa_model.pkl')
    print("Done!")

if __name__ == '__main__':
    train_and_save()
