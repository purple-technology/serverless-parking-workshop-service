# serverless-parking-workshop-service

## deploy stack

1. generate key and signing request for IOT thing
```
npm run generate-key-csr
```

2. deploy stack
```
npm run deploy
```

3. download certificate for IOT Thing
```
npm run download-certificate
```

## M5Stack 
1. Start M5Stack and burn UIFlow firmware - see https://docs.m5stack.com/en/quick_start/core2/uiflow
2. Connect M5stack to Wifi network and it will display API key.
3. Open UIFlow https://flow.m5stack.com/ and connect through API key to M5Stack device. Connect UIFlow to M5stack and upload code `uiFlow.m5f` to M5StackCore2 thing. 
4. Upload certificates (certificate.pem.key & certificate.pem.crt) to device.
5. Update code with uploaded certificates and run device.

For detailed istructions see https://docs.m5stack.com/en/uiflow/iotcloud/aws
