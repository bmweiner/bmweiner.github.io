---
layout: post
title:  "Storing IP Camera Recordings with FTP"
date:   2017-12-26 17:00:00 -0400
modified: 2017-12-26 17:00:00 -0400
summary: "Setup FTP and SMB on a raspberry pi to store IP Camera footage."
category: computer science
tags: [raspberry pi, Amcrest, FTP, SMB]
---
These are my notes for configuring external storage and installing FTP and Samba
on a Raspberry Pi for the purpose of storing and accessing IP Camera footage.
This was tested with an Amcrest IP2M-841.

## Install FTP Server

Install Pure-FTPd, create user, and shared location:

    apt-get install pure-ftpd
    groupadd ftpgroup
    useradd ftpuser -g ftpgroup -s /sbin/nologin -d /dev/null
    mkdir /home/pi/FTP
    chown -R ftpuser:ftpgroup /home/pi/FTP
    pure-pw useradd camera -u ftpuser -g ftpgroup -d /home/pi/FTP -m
    service pure-ftpd restart

See [Pure-FTPd][ftp].

## Configure External Storage

Find the HDD details:

    blkid

Create a mount point, mount, and configure:

    mkdir /home/pi/FTP/cameras
    mount /dev/sda1 /home/pi/FTP/cameras
    vi /etc/fstab

Add to auto mount:

    /dev/sda1 /home/pi/FTP/cameras ext4 defaults,noatime 0 0

See [External Storage Configuration][storage].

## Install Samba

Install samba and configure:

    apt-get install samba
    vi /etc/samba/smb.conf

Add to config share:

    [public]
    Path = /home/pi/FTP
    Browseable = yes
    Writeable = yes
    Public = yes
    Guest ok = yes

Restart samba:

    /etc/init.d/samba restart

See [Samba Fast Start][samba].

[storage]:https://www.raspberrypi.org/documentation/configuration/external-storage.md
[ftp]: https://www.raspberrypi.org/documentation/remote-access/ftp.md
[samba]: https://www.samba.org/samba/docs/man/Samba-HOWTO-Collection/FastStart.html
