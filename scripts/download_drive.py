import os
import requests
import sys

def download_file_from_google_drive(id, destination):
    URL = "https://docs.google.com/uc?export=download&confirm=t"
    session = requests.Session()

    response = session.get(URL, params={'id': id}, stream=True)
    token = get_confirm_token(response)

    if token:
        params = {'id': id, 'confirm': token}
        response = session.get(URL, params=params, stream=True)

    save_response_content(response, destination)

def get_confirm_token(response):
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            return value
    return None

def save_response_content(response, destination):
    CHUNK_SIZE = 32768
    total_size = 0
    with open(destination, "wb") as f:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                f.write(chunk)
                total_size += len(chunk)
                if total_size % (1024 * 1024 * 10) < CHUNK_SIZE:
                    print(f"Downloaded {total_size / (1024*1024):.1f} MB...")
    print(f"Finished downloading: {destination} ({total_size / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    file_id = "1VAeJqltmdYJ3hrUNyiHDZmskvXuRayFY"
    dest = "/home/dattruong/Documents/JPNKanji/pdf/book2.pdf"
    download_file_from_google_drive(file_id, dest)
