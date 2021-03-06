# tasktree
A web application to organize todo lists containing interdepending tasks

# Installation
Very roughly:
```bash
su -
# as root:
apt install virtualenv git
mkdir -p /opt/venvs
cd /opt/venvs
git clone https://github.com/enguerrand/tasktree.git
cd tasktree
./fetch-assets.sh prod
mkdir venv
virtualenv -p /usr/bin/python3 venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
vi .env # Change the SECRET_KEY!
adduser --system tasktree
addgroup tasktree
usermod -aG tasktree tasktree
mkdir -p /var/tasktree/
python3 persistence.py setup
python3 persistence.py adduser myusername 
chown -R tasktree:tasktree /var/tasktree/
chmod 600 /var/tasktree/tasktree.db
# setup wsgi with webserver. 
# Note that you will need to enable BasicAuth for the webcal functionality to work. 
# (apache: "WSGIPassAuthorization On")
```
