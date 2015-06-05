Grok Web API
============


This package contains a WSGI application to interface with Grok. Its entry point is through the webapp module. 


When debugging, it's sometimes handy to use `curl` to send requests to Grok API; this example assumes that Grok is running on localhost and Grok API key is abcdef:
```
curl -k -u abcdef: https://localhost/_metrics/cloudwatch -X GET
```


