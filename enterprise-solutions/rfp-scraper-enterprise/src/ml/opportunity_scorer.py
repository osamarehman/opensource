#!/usr/bin/env python3
"""
ML-powered opportunity scoring and classification
"""
import pandas as pd
import numpy as np
import logging
import joblib
import re
from typing import List, Tuple, Optional, Dict
from datetime import datetime
from pathlib import Path

# Import ML libraries with fallback
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

from ..core.models import RFPOpportunity
from ..database.database_manager import DatabaseManager


class MLOpportunityScorer:
    """Machine learning-based opportunity scoring system"""

    def __init__(self, db_manager: DatabaseManager, model_path: Optional[str] = None):
        self.db_manager = db_manager
        self.model_path = Path(model_path) if model_path else Path("ml/models/rfp_classifier.pkl")
        self.model_path.parent.mkdir(parents=True, exist_ok=True)

        self.logger = logging.getLogger(__name__)
        self.model_trained = False

        if not ML_AVAILABLE:
            self.logger.warning("ML libraries not available. Using fallback scoring.")
            return

        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)

        # Try to load existing model
        self._load_model()

    def prepare_training_data(self) -> Tuple[Optional[pd.DataFrame], Optional[np.ndarray]]:
        """Prepare training data from historical opportunities"""
        if not ML_AVAILABLE:
            return None, None

        training_data = self.db_manager.get_opportunities_for_training()

        if len(training_data) < 50:  # Need minimum data for training
            self.logger.warning("Insufficient training data for ML model")
            return None, None

        df = pd.DataFrame(training_data)

        # Feature engineering
        df['text_features'] = df['title'] + ' ' + df['description'].fillna('')
        df['value_numeric'] = df['value'].apply(self._extract_numeric_value)
        df['agency_category'] = df['agency'].apply(self._categorize_agency)

        # Create target variable (high/medium/low priority)
        df['priority'] = pd.cut(df['score'], bins=[0, 3, 7, 10], labels=['low', 'medium', 'high'])

        return df, df['priority'].values

    def train_model(self) -> bool:
        """Train the ML model on historical data"""
        if not ML_AVAILABLE:
            self.logger.warning("ML libraries not available. Cannot train model.")
            return False

        df, y = self.prepare_training_data()

        if df is None:
            return False

        try:
            # Prepare features
            text_features = self.vectorizer.fit_transform(df['text_features'])

            numerical_features = np.column_stack([
                df['value_numeric'].fillna(0),
                pd.get_dummies(df['agency_category']).values,
                pd.get_dummies(df['urgency']).values
            ])

            # Combine features
            X = np.hstack([text_features.toarray(), numerical_features])

            # Split and train
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            self.classifier.fit(X_train, y_train)

            # Evaluate
            y_pred = self.classifier.predict(X_test)
            report = classification_report(y_test, y_pred)
            self.logger.info(f"Model training complete. Classification report:\n{report}")

            # Save model
            self._save_model()
            self.model_trained = True

            return True

        except Exception as e:
            self.logger.error(f"Model training failed: {e}")
            return False

    def score_opportunity(self, opportunity: RFPOpportunity) -> float:
        """Score a single opportunity using the trained model"""
        if not ML_AVAILABLE or not self.model_trained:
            return self._fallback_scoring(opportunity)

        try:
            # Prepare features
            text = opportunity.title + ' ' + opportunity.description
            text_features = self.vectorizer.transform([text])

            value_numeric = self._extract_numeric_value(opportunity.value)
            agency_cat = self._categorize_agency(opportunity.agency)

            # Create feature vector (simplified for single prediction)
            numerical_features = np.array([[
                value_numeric,
                1 if agency_cat == 'federal' else 0,
                1 if agency_cat == 'state' else 0,
                1 if agency_cat == 'local' else 0,
                1 if opportunity.urgency.lower() == 'high' else 0,
                1 if opportunity.urgency.lower() == 'medium' else 0,
                1 if opportunity.urgency.lower() == 'low' else 0
            ]])

            # Combine features
            X = np.hstack([text_features.toarray(), numerical_features])

            # Predict probabilities
            probabilities = self.classifier.predict_proba(X)[0]

            # Convert to 0-10 scale
            priority_scores = {'low': 2, 'medium': 5.5, 'high': 8.5}
            classes = self.classifier.classes_

            weighted_score = sum(prob * priority_scores.get(cls, 0) for prob, cls in zip(probabilities, classes))

            return min(max(weighted_score, 0), 10)  # Clamp to 0-10

        except Exception as e:
            self.logger.error(f"ML scoring failed: {e}")
            return self._fallback_scoring(opportunity)

    def _extract_numeric_value(self, value_str: str) -> float:
        """Extract numeric value from value string"""
        if not value_str:
            return 0

        value_str = value_str.lower().replace(',', '').replace('$', '')

        # Extract numbers
        numbers = re.findall(r'\d+(?:\.\d+)?', value_str)

        if not numbers:
            return 0

        base_value = float(numbers[0])

        # Apply multipliers
        if 'million' in value_str or 'm' in value_str:
            return base_value * 1000000
        elif 'thousand' in value_str or 'k' in value_str:
            return base_value * 1000
        else:
            return base_value

    def _categorize_agency(self, agency: str) -> str:
        """Categorize agency type"""
        agency_lower = agency.lower()

        federal_keywords = ['department', 'federal', 'national', 'gsa', 'dod', 'va']
        state_keywords = ['state', 'commonwealth']
        local_keywords = ['city', 'county', 'municipal', 'town']

        for keyword in federal_keywords:
            if keyword in agency_lower:
                return 'federal'

        for keyword in state_keywords:
            if keyword in agency_lower:
                return 'state'

        for keyword in local_keywords:
            if keyword in agency_lower:
                return 'local'

        return 'other'

    def _fallback_scoring(self, opportunity: RFPOpportunity) -> float:
        """Fallback scoring when ML model is unavailable"""
        score = 0.0

        # Urgency scoring
        urgency_scores = {'high': 3.0, 'medium': 2.0, 'low': 1.0}
        score += urgency_scores.get(opportunity.urgency.lower(), 1.0)

        # Value scoring
        value_numeric = self._extract_numeric_value(opportunity.value)
        if value_numeric > 1000000:
            score += 3.0
        elif value_numeric > 100000:
            score += 2.0
        elif value_numeric > 10000:
            score += 1.0

        # Keyword scoring
        relevant_keywords = ['technology', 'software', 'digital', 'payment', 'fintech']
        text = (opportunity.title + ' ' + opportunity.description).lower()

        for keyword in relevant_keywords:
            if keyword in text:
                score += 0.5

        return min(score, 10.0)

    def _save_model(self):
        """Save trained model to disk"""
        if not ML_AVAILABLE:
            return

        try:
            model_data = {
                'vectorizer': self.vectorizer,
                'classifier': self.classifier,
                'trained_at': datetime.now().isoformat(),
                'feature_names': self.vectorizer.get_feature_names_out() if hasattr(self.vectorizer, 'get_feature_names_out') else []
            }
            joblib.dump(model_data, self.model_path)
            self.logger.info(f"Model saved to {self.model_path}")
        except Exception as e:
            self.logger.error(f"Model save failed: {e}")

    def _load_model(self) -> bool:
        """Load trained model from disk"""
        if not ML_AVAILABLE:
            return False

        try:
            if self.model_path.exists():
                model_data = joblib.load(self.model_path)
                self.vectorizer = model_data['vectorizer']
                self.classifier = model_data['classifier']

                self.logger.info(f"Loaded ML model trained at: {model_data['trained_at']}")
                self.model_trained = True
                return True
        except Exception as e:
            self.logger.warning(f"Could not load ML model: {e}")

        return False

    def retrain_if_needed(self, threshold: int = 20) -> bool:
        """Retrain model if sufficient new data is available"""
        try:
            # Count new opportunities with scores
            training_data = self.db_manager.get_opportunities_for_training()

            if len(training_data) >= threshold:
                self.logger.info(f"Sufficient new data available ({len(training_data)} opportunities), retraining ML model...")
                return self.train_model()

        except Exception as e:
            self.logger.error(f"Retrain check failed: {e}")

        return False

    def get_model_info(self) -> Dict[str, any]:
        """Get information about the current model"""
        info = {
            'ml_available': ML_AVAILABLE,
            'model_trained': self.model_trained,
            'model_path': str(self.model_path)
        }

        if ML_AVAILABLE and self.model_trained:
            try:
                model_data = joblib.load(self.model_path)
                info.update({
                    'trained_at': model_data.get('trained_at'),
                    'feature_count': len(model_data.get('feature_names', [])),
                    'model_type': type(self.classifier).__name__
                })
            except:
                pass

        return info

    def predict_batch(self, opportunities: List[RFPOpportunity]) -> List[float]:
        """Score multiple opportunities efficiently"""
        if not opportunities:
            return []

        if not ML_AVAILABLE or not self.model_trained:
            return [self._fallback_scoring(opp) for opp in opportunities]

        try:
            # Prepare batch features
            texts = [opp.title + ' ' + opp.description for opp in opportunities]
            text_features = self.vectorizer.transform(texts)

            numerical_features = []
            for opp in opportunities:
                value_numeric = self._extract_numeric_value(opp.value)
                agency_cat = self._categorize_agency(opp.agency)

                feature_row = [
                    value_numeric,
                    1 if agency_cat == 'federal' else 0,
                    1 if agency_cat == 'state' else 0,
                    1 if agency_cat == 'local' else 0,
                    1 if opp.urgency.lower() == 'high' else 0,
                    1 if opp.urgency.lower() == 'medium' else 0,
                    1 if opp.urgency.lower() == 'low' else 0
                ]
                numerical_features.append(feature_row)

            numerical_features = np.array(numerical_features)
            X = np.hstack([text_features.toarray(), numerical_features])

            # Predict probabilities
            probabilities = self.classifier.predict_proba(X)

            # Convert to scores
            priority_scores = {'low': 2, 'medium': 5.5, 'high': 8.5}
            classes = self.classifier.classes_

            scores = []
            for prob_row in probabilities:
                weighted_score = sum(prob * priority_scores.get(cls, 0) for prob, cls in zip(prob_row, classes))
                scores.append(min(max(weighted_score, 0), 10))

            return scores

        except Exception as e:
            self.logger.error(f"Batch ML scoring failed: {e}")
            return [self._fallback_scoring(opp) for opp in opportunities]