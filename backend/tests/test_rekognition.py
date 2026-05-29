import os
import boto3
from pathlib import Path
from dotenv import load_dotenv

# Configurar rutas absolutas dinámicas
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / '.env'
IMAGES_DIR = BASE_DIR / 'images'

# Cargar variables de entorno
load_dotenv(dotenv_path=ENV_PATH)

def test_detect_faces():
    print("Iniciando prueba de detect_faces...")
    
    client = boto3.client(
        'rekognition',
        region_name=os.getenv('AWS_REGION'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    image_path = IMAGES_DIR / 'yo1.jpeg'
    
    if not image_path.exists():
        print(f"Error: La imagen no existe en la ruta {image_path}")
        return

    try:
        with open(image_path, 'rb') as image_file:
            image_bytes = image_file.read()
            
        response = client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL']
        )
        
        face_details = response.get('FaceDetails', [])
        print(f"\nRostros detectados: {len(face_details)}")
        
        for i, face in enumerate(face_details, 1):
            print(f"\nRostro {i}:")
            
            confidence = face.get('Confidence', 0)
            print(f"  - Confianza: {confidence:.2f}%")
            
            gender = face.get('Gender', {})
            print(f"  - Género: {gender.get('Value')} (Confianza: {gender.get('Confidence', 0):.2f}%)")
            
            age_range = face.get('AgeRange', {})
            print(f"  - Rango de edad: {age_range.get('Low')} - {age_range.get('High')} años")
            
            emotions = face.get('Emotions', [])
            if emotions:
                principal_emotion = max(emotions, key=lambda x: x.get('Confidence', 0))
                print(f"  - Emoción principal: {principal_emotion.get('Type')} (Confianza: {principal_emotion.get('Confidence', 0):.2f}%)")
                
    except Exception as e:
        print(f"Error al llamar a AWS Rekognition: {str(e)}")

if __name__ == "__main__":
    test_detect_faces()
