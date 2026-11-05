# Wrap the built pages for the n8n-hosted links:
#   hosted.html       Kash's link: every tab, no sign-in
#   hosted_team.html  the team link: Podcast only, served after sign-in, sends the sign-in token with every request
HEAD='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n<style>:root{color-scheme:light}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}.rl-who{font-size:12.5px;color:#69707B;margin-right:10px;white-space:nowrap}.rl-who button{all:unset;cursor:pointer;color:#2350C9;font-weight:600}</style>\n'
def wrap(src,auth):
    page=open(src).read()
    return HEAD+('<style>.brand{white-space:nowrap}@media(max-width:600px){.wrap>.top{flex-wrap:wrap;align-items:flex-start}.wrap>.top .topr{justify-content:flex-start;width:100%}.rl-who{white-space:normal}}</style>\n<script>'+open('ep/hosted_auth.js').read()+'\n'+open('ep/hosted_admin.js').read()+'</script>\n' if auth else '<script>window.__rlViewer="Kash"</script>\n')+'</head>\n<body>\n'+page+'\n</body>\n</html>\n'
open('hosted.html','w').write(wrap('podcast-ceo/index.html',False))
open('hosted_team.html','w').write(wrap('podcast-ceo/team.html',True))
print('ok')
