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

## Intercept HTTP packet
```bash
sudo tcpdump -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'
```
Note that the port should be modified if you use proxy 
