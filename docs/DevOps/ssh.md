# SSH Commands

## Get output of a command and exit immediately
```bash
ssh -o "StrictHostKeyChecking no" -o "LogLevel ERROR" xxx@xxx -i xxx.pem pwd
```
 - `StrictHostKeyChecking` accept fingerprint automatically
 - `LogLevel` you don't want a log message mess up with your output
