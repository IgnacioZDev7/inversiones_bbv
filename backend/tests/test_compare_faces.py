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

def test_compare_faces():
    print("Iniciando prueba de compare_faces...")
    
    client = boto3.client(
        'rekognition',
        region_name=os.getenv('AWS_REGION'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    source_path = IMAGES_DIR / 'yo1.jpeg'
    target_path = IMAGES_DIR / 'yo2.jpeg'
    
    if not source_path.exists():
        print(f"Error: La imagen de origen no existe en la ruta {source_path}")
        return
        
    if not target_path.exists():
        print(f"Error: La imagen de destino no existe en la ruta {target_path}")
        return

    try:
        with open(source_path, 'rb') as source_file:
            source_bytes = source_file.read()
            
        with open(target_path, 'rb') as target_file:
            target_bytes = target_file.read()
            
        similarity_threshold = 85.0
        
        response = client.compare_faces(
            SourceImage={'Bytes': source_bytes},
            TargetImage={'Bytes': target_bytes},
            SimilarityThreshold=similarity_threshold
        )
        
        face_matches = response.get('FaceMatches', [])
        
        if face_matches:
            match = face_matches[0]
            similarity = match.get('Similarity', 0)
            confidence = match.get('Face', {}).get('Confidence', 0)
            
            print(f"\nSimilarity (%): {similarity:.2f}")
            print(f"Confidence (%): {confidence:.2f}")
            
            if similarity >= similarity_threshold:
                print("\n✅ VERIFIED (MISMA PERSONA)")
            else:
                print("\n❌ NOT MATCHED")
        else:
            print("\n❌ NOT MATCHED (Los rostros no coinciden o no alcanzan el umbral).")
            
    except client.exceptions.InvalidParameterException as e:
         print(f"Error: Parámetro inválido. ¿Hay rostros visibles en ambas imágenes? Detalles: {str(e)}")
    except Exception as e:
        print(f"Error al llamar a AWS Rekognition: {str(e)}")

if __name__ == "__main__":
    test_compare_faces()
