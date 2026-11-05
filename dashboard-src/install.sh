#!/bin/sh
# Upload a hosted page into n8n (split into 30 KB parts)
#   ./install.sh        Kash's link  (hosted.html)
#   ./install.sh team   the team link (hosted_team.html)
cd "$(dirname "$0")"
PAGE=${1:-ceo}
SRC=hosted.html; [ "$PAGE" = team ] && SRC=hosted_team.html
python3 -c "
import json,datetime,sys
h=open('$SRC').read();n=30000
print(json.dumps({'page':'$PAGE','version':datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%S'),'parts':[h[i:i+n] for i in range(0,len(h),n)]}))" > install.json
curl -sS -m 90 -X POST -H 'Content-Type: application/json' --data-binary @install.json \
  https://simplexmedia.app.n8n.cloud/webhook/relearn-ceo-install-$(cat install_token.txt)
echo
