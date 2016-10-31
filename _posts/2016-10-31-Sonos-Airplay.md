---
layout: post
title:  "Sonos Airplay"
date:   2016-10-31 00:39:00 -0400
summary: "Stream audio to any Sonos component via AirPlay using a
Raspberry Pi, Shairport Sync, DarkIce, and Icecast2."
category: dev
tags: [raspberry pi, sonos, hack]
---
Stream audio to any Sonos component via AirPlay using a
Raspberry Pi (Model B, Raspbian Jessie) and the following software:

  * Shairport Sync: configures the Raspberry Pi as an AirPlay audio player.
  * DarkIce: encodes audio received from AirPlay (system audio) and sends it to
    Icecast2.
  * Icecast2: serves streaming audio from DarkIce at a network URL.

## Setup Raspberry Pi

### Alsa Loopback [1](#sources)

Create a loopback device to capture system audio.

```shell
sudo modprobe snd-aloop
```

Persist by adding the following to `/etc/modules`:

```shell
snd-aloop
```

> note: use `aplay -l` to see playback devices

### Shairport Sync

Install:

> note: this method uses [stow](https://www.gnu.org/software/stow/), to symlink
> files installed to `/usr/local/stow/shairport-sync`.

```shell
cd /usr/src
git clone https://github.com/mikebrady/shairport-sync.git
cd shairport-sync
sudo apt-get install build-essential autoconf automake libtool \
                     libdaemon-dev libasound2-dev libpopt-dev \
                     libconfig-dev avahi-daemon libavahi-client-dev \
                     libssl-dev libsoxr-dev
autoreconf -i -f
./configure --with-alsa --with-avahi --with-ssl=openssl --with-metadata \
            --with-soxr --with-systemd --prefix=/usr/local
make PREFIX=/usr/local
sudo make install prefix=/usr/local/stow/shairport-sync
cd /usr/local/stow
sudo stow shairport-sync
```

Edit `/lib/systemd/system/shairport-sync.service` to comment out the User/Group
lines (creating this user and group was not needed):

```conf
;User=shairport-sync
;Group=shairport-sync
```

Edit `/etc/shairport-sync.conf`:

```conf
general = {
  name = "Sonos";
  interpolation = "soxr";
};
```

> note: set interpolation to `basic` to reduce cpu load.

Start and persist on reboot:

```shell
sudo systemctl start shairport-sync.service
sudo systemctl enable shairport-sync.service
```

### Icecast2

Install:

```shell
sudo apt-get install icecast2
```

Edit `/etc/icecast2/icecast.xml` to reduce latency:

```xml
<limits>
    <burst-on-connect>0</burst-on-connect>
    <burst-size>0</burst-size>
</limits>
```

Start and persist on reboot:

```shell
sudo systemctl start icecast2
sudo systemctl enable icecast2
```

### DarkIce

Install:

```shell
sudo apt-get install darkice
```

Create and add the following to `/etc/darkice.cfg`:

```ini
# see the darkice.cfg man page for details

[general]
duration        = 0
bufferSecs      = 1
reconnect       = yes
realtime        = yes
rtprio          = 3

[input]
device          = hw:Loopback,1,0
sampleRate      = 44100
bitsPerSample   = 16
channel         = 2

[icecast2-0]
bitrateMode     = vbr
format          = mp3
quality         = 0.8
server          = localhost
port            = 8000
password        = <pwd>
mountPoint      = sonos
name            = sonos
```

Create and edit `/etc/systemd/system/darkice.service`:

```ini
[Unit]
Description=DarkIce Live audio streamer
After=icecast2.service

[Service]
ExecStart=/usr/bin/darkice

[Install]
WantedBy=multi-user.target
```

start, and persist on reboot:

```shell
sudo systemctl daemon-reload
sudo systemctl start darkice.service
sudo systemctl enable darkice.service
```

## Setup Sonos Controller

Download the [Sonos Desktop Controller](http://www.sonos.com/controller-app)

Add the icecast2
[streaming URL](https://sonos.custhelp.com/app/answers/detail/a_id/264/~/how-to-add-an-internet-radio-station-to-sonos)
(http://&lt;ip_addr&gt;:8000/sonos.m3u) via the
Sonos Desktop Controller

## Play Music

  1. Reboot the Raspberry Pi
  2. Play music to the 'Sonos' AirPlay controller (Raspberry Pi)
  3. Connect the Sonos zone(s) to the stream via My Radio Stations in TuneIn

### Sources

 [1] https://www.raspberrypi.org/forums/viewtopic.php?t=98987&p=695967
