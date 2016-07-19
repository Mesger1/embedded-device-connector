install samba :
> sudo apt-get install samba samba-common-bin

edit samba config file :
>sudo nano /etc/samba/smb.conf

find and modify : 
```
workgroup = your_workgroup_name
wins support = yes
```

add share at bottom of file :
```
[pihome]
   comment= Pi Home
   path=/home/pi
   browseable=Yes
   writeable=Yes
   only guest=no
   create mask=0777
   directory mask=0777
   public=no
```

finally set password for the share :
> sudo smbpasswd -a pi
