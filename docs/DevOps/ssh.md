# SSH Commands

## Get output of a command and exit immediately
```bash
ssh -o "StrictHostKeyChecking no" -o "LogLevel ERROR" xxx@xxx -i xxx.pem pwd
```
 - `StrictHostKeyChecking` accept fingerprint automatically
 - `LogLevel` you don't want a log message mess up with your output

## Check if a command exits
```bash
if ! [ -x "$(command -v jq)" ]; then
    echo "jq not found, please install jq at first: https://stedolan.github.io/jq/download/" 
    exit 1
fi
```

