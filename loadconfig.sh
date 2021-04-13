#!/bin/bash
confpath=/home/pi/tclock/public/data/config.json
#wpapath=/etc/wpa_supplicant/wpa_supplicant.conf
#wpa=$(<$wpapath)
#ssidString=$(cat $wpapath | grep ssid=)
location=$(cat $confpath | jq '.location')
connected=$(cat $confpath | jq '.connected')
config=$(</home/pi/tclock/public/data/config.json)

#check if there is a valid wpa_supplicant configuration
#function wpacheck {
#    if [ -z $ssidString ];then
#        echo "ssid nope"
#    else
#        echo "ssid yep"
#    fi
#}

#check config file if the clock is connected to the internet
# if not, set it using setup js

#check config file to see if location is set
# if not, set is using setup js

(date) &>> scriptlog

function locationcheck {
    if [ -z "$location" ];then
        (echo "location nope") &>> scriptlog
        jq '.location = "DEFAULT LOCATION (Ponce Inlet, FL)"' $confpath > tmp.$$.json && mv tmp.$$.json $confpath
    else
        (echo "location yep") &>> scriptlog
    fi
}

#check if there is a valid internet connection
function ipcheck {
(nmcli device show wlan0) &>> scriptlog
}

function pingcheck {
    #pingTest=$(wget --spider https://tidesandcurrents.noaa.gov/ | grep 200 | wc -l)
    #(wget --spider https://tidesandcurrents.noaa.gov/) &>> scriptlog
   # echo $?
   (sudo nmcli networking connectivity check | grep full) 
    
if [ $? -eq 0 ]; then
        (echo "ping yep") &>> scriptlog
        jq '.connected = true' $confpath > tmp.$$.json && mv tmp.$$.json $confpath
        ipadd="http://"$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')":5000"
        qrencode $ipadd -o ~/tclock/public/images/ipqrcode.png
        cd /home/pi/tclock && node app.js &
        
	else                            #if ping fails write false to config.json file and start the AP network
        
	(echo "ping nope sleep") &>> scriptlog
        (sleep 5) &>> scriptlog
	(sudo nmcli networking connectivity check | grep full)       
		if [ $? -eq 0 ]; then
			(echo "ping yep") &>> scriptlog
       			jq '.connected = true' $confpath > tmp.$$.json && mv tmp.$$.json $confpath
                ipadd="http://"$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')":5000"
                qrencode $ipadd -o ~/tclock/public/images/ipqrcode.png
        		cd /home/pi/tclock && node app.js &
        	
		else                            #if ping fails write false to config.json file and start the AP network
	 		jq '.connected = false' $confpath > tmp.$$.json && mv tmp.$$.json $confpath
        		sudo killall chromium-browse && sudo nginx; DISPLAY=:0 chromium-browser  --noerrdialogs --disable-infobars --disable-notifications --check-for-update-interval=31536000 --kiosk --app=http://localhost:8080 &
        		sudo wifi-connect -s"Tide Clock Setup"; sudo reboot
		fi    
fi
}

#locationcheck
ipcheck
pingcheck

#echo "location is : $location"
#echo "wifi is currently: $connected"
#echo "wpa: $wpa"
#echo "ssid: $ssidString"



#num_a=100
#num_b=200

#if [ $num_a -lt $num_b ]; then
#    echo "$num_a is less than $num_b!"
#fi

#network={
    #ssid="CocaCola-dev"
    #psk="rootbeer"
    #key_mgmt=WPA-PSK
#}
exit
