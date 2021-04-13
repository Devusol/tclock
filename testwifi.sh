#!/bin/bash

dater="Hello date: "$(date) 
echo $dater 

ipadd="http://"$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')":5000"

echo $ipadd

qrencode $ipadd -o ~/tclock/qrtest1.png