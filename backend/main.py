from flask import jsonify, make_response
import functions_framework
import os
import logging 
from faker import Faker

logging.basicConfig(
    level="INFO", format='%(asctime)s %(levelname)s %(message)s')
AUTH = os.getenv('BACKEND_TOKEN')


@functions_framework.http
def hello(request):
    logging.info('Backend API starting up ')
    
    logging.info(request.headers)
    fake = Faker()
    txt = (fake.text() + "\n")
    return make_response(txt, 200)


