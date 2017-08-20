---
layout: post
title:  "Self-Hosted Web Analytics with AWS and Crumby"
date:   2017-08-20 6:00:00 -0500
image: "/assets/images/arch_analytics.png"
category: analytics
tags: [python, web, open-source]
---
Crumby is self-hosted open source application for tracking and reporting visitor
usage of websites. Crumby is a Flask application so it works with well known
tools such as Apache, MySQL, and Python. Checkout Crumby on [github][readme] to
see what data is tracked and how to interact with the reporting API.

In this post, I will cover how to install crumby on an Amazon EC2 instance
running httpd24 (with mod_wsgi) and mysql56. Many of the commands in this
tutorial will need to be run as root. Just add `sudo` in front of the command
if you get a permission error.

## Launch an Amazon EC2 Instance

Follow the instructions in the Amazon EC2 [User Guide for Linux Instances][ec2]
to launch an Amazon Linux AMI.

Select the appropriate instance type and storage for your use case. For a small
website, a t2.nano with 8 GiB EBS should work, but will probably require a swap
file or some memory tuning.

Make sure the instance's security group allows http/https access.

## Connect to the Instance

1. SSH to the instance using your private key and public DNS name

  > Bonus: Set an SSH Alias for your AWS instance in `~/.ssh/config` to simplify
  > connecting, [man ssh_config][ssh]

        Host aws
          HostName ec2-XXX-XXX-XXX-XXX.compute-1.amazonaws.com
          User ec2-user
          IdentityFile ~/keys/aws.pem

        ssh aws

## Quick Deployment

If you would rather skip the explanation and just run the commands, the
following steps will setup Crumby on a t2.nano. Otherwise, move on to the next
section, [Install Packages][install_packages] to manually run each command.

1. Download scripts

        wget https://raw.githubusercontent.com/bmweiner/crumby/master/deployment/linux/create_swap.sh
        wget https://raw.githubusercontent.com/bmweiner/crumby/master/deployment/linux/apache_mysql.sh
        wget https://raw.githubusercontent.com/bmweiner/crumby/master/deployment/linux/tune_memory.sh

2. Set the `domain` variable in `apache_mysql.sh` to the server's pubic DNS name

        domain='ec2-XXX-XXX-XXX-XXX.compute-1.amazonaws.com'

3. Run the scripts as root

        sudo sh create_swap.sh
        sudo sh apache_mysql.sh
        sudo sh tune_memory.sh

4. Now you are up and running and just need to include a pointer to `cmbs.js` on
   the webpages you want to track. See [Webpage Configuration][webpage_config].

## Install Packages

1. Install build dependencies

        yum update -y
        yum install -y gcc libffi-devel python-devel

2. Install Apache Web Server, MySQL, and mod_wsgi

        yum install -y httpd24 mysql56-server mod24_wsgi-python27.x86_64

3. Create a directory for Crumby resources

        mkdir /var/lib/crumby

4. Create and activate a virtual environment

        virtualenv /var/lib/crumby/virtenv
        source /var/lib/crumby/virtenv/bin/activate

5. Install python packages to the virtual environment

        pip install crumby pymysql

6. Install GeoLite2-City database and create example crumby config file

        cd /var/lib/crumby
        crumby geoip
        crumby init

7. Create a password for MySQL and a secret key

        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 24 > /var/lib/crumby/MYSQL_PASS
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 24 > /var/lib/crumby/SECRET_KEY

8. (optional) Remove build dependencies

 > Note: This is just to save space. If you plan to use these tools in the
   future, just keep them.

        yum erase -y gcc libffi-devel python-devel
        yum autoremove -y

## Configure MySQL

1. Start MySQL and secure the installation - set the new password to the random
   value previously generated in `/var/lib/crumby/MYSQL_PASS`

        service mysqld start
        mysql_secure_installation

2. Create the crumby database

        mysql -uroot -p$(cat /var/lib/crumby/MYSQL_PASS) --execute="CREATE DATABASE crumby;"

3. Set MySQL to start on reboot (modify run level)

        chkconfig mysqld on

## Configure Apache

1. Open the Apache config file

        vi /etc/httpd/conf/httpd.conf

2. Add a virtual host for the Crumby application - replace `site.com` with the
   server's public DNS name, and uncomment those lines

        <VirtualHost \*:80>
          #ServerName site.com
          #ServerAdmin admin@site.com

          WSGIProcessGroup crumby
          WSGIDaemonProcess crumby python-home=/var/lib/crumby/virtenv
          WSGIScriptAlias / /var/www/wsgi-scripts/crumby.wsgi

          <Directory /var/www/wsgi-scripts>
            <Files crumby.wsgi>
              Require all granted
            </Files>
          </Directory>

        </VirtualHost>

3. Set Apache Web Server to start on reboot (modify run level)

        chkconfig httpd on

### Configure SSL/TLS (Recommended)

Users that access private queries through the web UI will need to authenticate.
To protect credentials
[Configure Apache Web Server on Amazon Linux to Use SSL/TLS][ssl]

1. Install Apache module

        yum install -y mod24_ssl

2. Open the Apache config file

        vi /etc/httpd/conf/httpd.conf

3. Add a virtual host to handle requests on 443 - replace `site.com` with the
   server's public DNS name, and uncomment those lines

        <VirtualHost \*:443>
          #ServerName site.com
          #ServerAdmin admin@site.com

          WSGIProcessGroup crumby
          WSGIScriptAlias / /var/www/wsgi-scripts/crumby.wsgi

          <Directory /var/www/wsgi-scripts>
            <Files crumby.wsgi>
              Require all granted
            </Files>
          </Directory>

        </VirtualHost>

## Configure Crumby

1. Open crumby config for editing

        vi /var/lib/crumby/crumby.cfg

2. Modify parameters for production, see [Crumby Configuration][crumby_config]
   for a description of the configuration parameters.

        import os

        base_path = '/var/lib/crumby'
        with open(os.path.join(base_path, 'MYSQL_PASS')) as f:
            pw = f.read().strip('\n')
            db = 'mysql+pymysql://root:{}@localhost/crumby'.format(pw)

        DOMAIN = ''  # server's pubic DNS name

        SQLALCHEMY_DATABASE_URI = db

        GEOIP2_DATABASE_NAME = '/var/lib/crumby/GeoLite2-City.mmdb'

        with open(os.path.join(base_path, 'SECRET_KEY')) as f:
            SECRET_KEY = f.read().strip('\n')

        SESSION_COOKIE_SECURE = True  # Include if you enabled SSL/TLS
        CROSSDOMAIN_ORIGIN = ''  # URL(s) permitted to access the crumby API

3. Create the WSGI application script file

        mkdir /var/www/wsgi-scripts
        vi /var/www/wsgi-scripts/crumby.wsgi

4. Add the following contents to the script file

        #!/usr/bin/env python
        """WSGI entry point."""

        import os

        os.environ['CRUMBY_SETTINGS'] = '/var/lib/crumby/crumby.cfg'

        from crumby import app as application

## Startup and Testing

1. Start Apache and MySQL

        service mysqld restart
        service httpd restart

2. View error logs to troubleshoot any errors

        tail -f /etc/httpd/logs/error_log

## Webpage Configuration

To begin sending tracking data to your analytics server, just include a pointer
to the cmb.js script on the webpages you want to track. Replace `site.com` with
the server's pubic DNS name (e.g. ec2-XXX-XXX-XXX-XXX.compute-1.amazonaws.com).

        <script src="https://site.com/cmb.js"></script>

## (optional) Tune Settings for a Low Memory VPS

If you are running an instance with low memory (e.g. t2.nano), you will probably
have trouble starting mysql. You can try creating a swap file and/or adjusting
memory allocation settings for MySQL and/or Apache. Alternatively, you can
provision an EC2 instance with higher dedicated memory.

### Create a Swap File

Refer to the DigitalOcean guide, [How To Add Swap on CentOS7][swap], here is
the general gist:

1. Setup a swap file

        fallocate -l 1G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile

2. Mount the swap file on boot by adding this line to `/etc/fstab`

        /swapfile   swap    swap    sw  0   0

3. Set swappiness and cache pressure parameters in `/etc/sysctl.conf`

        # Lower swappiness and cache pressure for low-memory vps
        vm.swappiness = 10
        vm.vfs_cache_pressure=50

4. Apply the parameter settings

        sysctl -p

### Adjust Memory Allocation

Refer to [InnoDB Startup Options and System Variables][innodb] for parameter
specifics.

1. Configure MySQL server system variables in `/etc/my.cnf`

        [mysqld]
        innodb_buffer_pool_size=32M
        innodb_log_buffer_size=256K
        key_buffer_size=8
        max_connections=10

2. Configure Apache configuration directives in `/etc/httpd/conf/httpd.conf`

        # configure directives for low memory
        <IfModule prefork.c>
            StartServers          3
            MinSpareServers       2
            MaxSpareServers       5
            MaxClients            10
            MaxRequestsPerChild   1000
        </IfModule>

[readme]: https://github.com/bmweiner/crumby
[ec2]: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html
[ssh]: https://man.openbsd.org/ssh_config
[ssl]: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/SSL-on-an-instance.html
[crumby_config]: https://github.com/bmweiner/crumby#crumby-configuration
[swap]: https://www.digitalocean.com/community/tutorials/how-to-add-swap-on-centos-7
[innodb]: https://dev.mysql.com/doc/refman/5.7/en/innodb-parameters.html

[install_packages]: #install-packages
[webpage_config]: #webpage-configuration
