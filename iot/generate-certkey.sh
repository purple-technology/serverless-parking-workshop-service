AWS_PROFILE=admin-purple-workshops aws iot get-registration-code
echo "\033[0;31mPut the registration code in the Common Name field! Other fields are optional. \n\033[0m"
openssl genrsa -out ./iot/certificate.pem.key 2048
openssl req -new -key ./iot/certificate.pem.key -out ./iot/certificate.pem.csr
