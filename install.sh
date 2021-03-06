#!/bin/bash
# Discovery Application Server installer
# 20200821/SK

# Get component locations
THIS_ADDR=`dig @resolver1.opendns.com ANY myip.opendns.com +short`
echo -n 'DNS/IP address of the Discovery Data Server: '
read DATA_ADDR

# Install prerequisites
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install node modules
sudo npm install

# Rewrite service file to reference install dir
SUBST=s@WORKINGDIR@$PWD@g
sed $SUBST Discovery.service.template > Discovery.service

# Rewrite config file to reference above values
SUBST=s@DATA@$DATA_ADDR@g
sed $SUBST src/config.js.template > src/config.js

# Install Procure
DISCOVERY_DIR=$PWD
cd ..
git clone https://github.com/sync-for-science/procure-wip
cd procure-wip
PROCURE_DIR=$PWD
curl https://open.epic.com/MyApps/EndpointsJson -o ./public/config/epic_endpoints.json
npm install
cd $DISCOVERY_DIR

# Connect Procure and Discovery
SUBST1=s@THIS@$THIS_ADDR@g
SUBST2=s@DATA@$DATA_ADDR@g
sed -e $SUBST1 -e $SUBST2 ./Procure.config-override-dev.json.template > ../procure-wip/public/config/config-override-dev.json

# Rewrite Procure service file to reference install dir
SUBST=s@WORKINGDIR@$PROCURE_DIR@g
sed $SUBST Procure.service.template > Procure.service

# Setup and start Discovery service
sudo systemctl stop Discovery.service
sudo systemctl disable Discovery.service
sudo systemctl enable $PWD/Discovery.service
sudo systemctl start Discovery.service

# Setup and start Procure service
sudo systemctl stop Procure.service
sudo systemctl disable Procure.service
sudo systemctl enable $PWD/Procure.service
sudo systemctl start Procure.service

# Done
echo
echo 'Done! Remember to:'
echo '         edit ./node_modules/react-scripts/config/webpack.config.js (see README.md)'
echo '         restart the Discovery service (sudo systemctl restart Discovery.service)'
