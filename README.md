# Issabel 4, Call Center Module and SimML5 Integration
Thanks:
https://github.com/DoubangoTelecom/sipml5
https://www.issabel.org/

### Firstly you have install Issabel 4 with Asterisk 11 and Call Center module.
#### After, you need to update with this command.
``` 
yum update
```
### We will need a domain name and we should make a secure certificate with letsencrypt.

#### Copy the cert.pem and privkey.pem files created with letsencrypt to the etc/asterisk/keys folder.
```
cp /etc/letsencrypt/live/yourdomain.com/cert.pem /etc/asterisk/keys
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/asterisk/keys

cd /etc/asterisk/keys

chown asterisk:asterisk cert.pem
chown asterisk:asterisk privkey.pem
```

### Let's set the Asterisk settings.

![image](https://user-images.githubusercontent.com/8502843/206913257-9b15f119-df84-47f4-814b-ae46c90a291e.png)

![image](https://user-images.githubusercontent.com/8502843/206913516-7977fa38-6950-432d-a8c2-3f04a3df38a1.png)

### Download webphone folder and copy /var/www/html/ inside.

#### We need to make some changes in the /var/www/html/index.php file.
Edit index.php and find this on estimated 340th line
```
themeSetup($smarty, $selectedMenu, $pdbACL, $pACL, $idUser);
```
Add the following lines after this line. **yourExtensionPassword must be same externsion secret.**
```
if(strpos($_SERVER[REQUEST_URI], 'agent_console') == true || strpos($_SERVER[REQUEST_URI], 'myex_config') == true)
{
  $webPhoneExtension = $pACL->getUserExtension($_SESSION['issabel_user']);
  if($webPhoneExtension>0)
  {
    echo '<script type="text/javascript">';
    echo "localStorage.setItem('mhrgl.com.identity.display_name', $webPhoneExtension);";
    echo "localStorage.setItem('mhrgl.com.identity.impi', $webPhoneExtension);";
    echo "localStorage.setItem('mhrgl.com.identity.impu', 'sip:'+ $webPhoneExtension+'@'+ window.location.hostname);";
    echo "localStorage.setItem('mhrgl.com.identity.password', 'yourExtensionPassword');";
    echo "localStorage.setItem('mhrgl.com.identity.realm', window.location.hostname);";
    echo "localStorage.setItem('mhrgl.com.expert.disable_video', 'true');";
    echo "localStorage.setItem('mhrgl.com.expert.disable_callbtn_options', 'true');";
    echo "localStorage.setItem('mhrgl.com.expert.websocket_server_url', 'wss://' + window.location.hostname + ':8089/ws');";
    //echo "localStorage.setItem('mhrgl.com.expert.ice_servers', '[]');";
    echo "localStorage.setItem('mhrgl.com.expert.ice_servers', '[{ url: \'stun:stun.a.google.com:19302\'}]');";
    echo "</script>";
    include("webphone/webphone.php");
  }
}
```
After adding it should look something like this.

![image](https://user-images.githubusercontent.com/8502843/206914378-33f680a5-c33b-44d3-8904-59bdcbc363f3.png)

### Add Webrtc Extension
![image](https://user-images.githubusercontent.com/8502843/206914544-894482be-bb15-4dfc-a088-0776c2531840.png)

![image](https://user-images.githubusercontent.com/8502843/206914667-99ad694f-8794-49b8-9ec8-9552cfd1b2aa.png)


### Assing extension for user
![image](https://user-images.githubusercontent.com/8502843/206914468-7b1b3d6e-bbca-4ffd-bb19-ecafd7099b60.png)

### Finally edit /var/www/html/modulesagent_console/index.php file. Find  $onlyCallback=0; on line 52 and change $onlyCallback=1;
![image](https://user-images.githubusercontent.com/8502843/207910860-5b13c767-1317-431f-944a-f17faf5cfe13.png)


## That's all we're going to do. When we enter agent_console and myex_config pages, the softphone becomes active.
![image](https://user-images.githubusercontent.com/8502843/206915181-1fe237d6-76a3-4413-876a-15accea6e25c.png)

