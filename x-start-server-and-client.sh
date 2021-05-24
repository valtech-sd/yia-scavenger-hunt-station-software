# Start the server
cd InteractiveStationServer
nohup npm start -- &

# Change into client and start that
cd ../InteractiveStationHtmlClient
nohup npm start -- &

