<?PHP
// The URL to fetch is the hostname + path
$url = $_GET['url'];

function buildRequestHeaders() {
    $headers = array();
    foreach(getallheaders() as $key => $value) {
        if($key != 'Host' && $key != 'Accept' && $key != 'Accept-Encoding' && $key != 'Accept-Language' && $key != 'Content-Length')
            array_push($headers, "$key: $value");
    }
    return $headers;
}

function getPostFields() {
    $post_fields = "";
    foreach($_POST as $key=>$value) { $post_fields .= $key.'='.urlencode($value).'&'; }
    return rtrim($post_fields, '&');
}

function generateMultipartFormRequest() {
    // form field separator
	$req = getallheaders();
	$delimiter = substr($req['Content-Type'],30);
    $data = '';

    // populate normal fields first (simpler)
    foreach ($_POST as $name => $content) {
       $data .= "--" . $delimiter . "\r\n\r\n";
       $data .= 'Content-Disposition: form-data; name="' . $name . '"' . "\r\n" . $content;
	   // note: double endline
       $data .= "\r\n\r\n";
     }

	 // populate file fields
     $data .= "--" . $delimiter . "\r\n";
     $data .= 'Content-Disposition: form-data; name="media[]";' .
             ' filename="' . $_FILES['media']['name'][0] . '"' . "\r\n";

     $data .= 'Content-Type: ' . $_FILES['media']['type'][0] . "\r\n";
     // this endline must be here to indicate end of headers
     $data .= "\r\n";
     // the file itself
     $data .= file_get_contents($_FILES['media']['tmp_name'][0]) . "\r\n";

     // last delimiter
     $data .= "--" . $delimiter . "--\r\n";

	 return $data;
}

$handle = curl_init($url);
$contentType = $_SERVER["CONTENT_TYPE"];

$request_method = strtolower($_SERVER['REQUEST_METHOD']);
switch ($request_method)
{
    case 'get':
        break;

    case 'post':
        curl_setopt($handle, CURLOPT_POST, true);
        if($_POST) {
		    if($_FILES)
               curl_setopt($handle, CURLOPT_POSTFIELDS, generateMultipartFormRequest());
			else
			   curl_setopt($handle, CURLOPT_POSTFIELDS, getPostFields());
        }
        else
            curl_setopt($handle, CURLOPT_POSTFIELDS, $HTTP_RAW_POST_DATA);
        break;

    case 'delete':
        curl_setopt($handle, CURLOPT_CUSTOMREQUEST, 'DELETE');
        break;
}
//curl_setopt($handle, CURLOPT_PROXY, '127.0.0.1:8888');
curl_setopt($handle, CURLOPT_HTTPHEADER , buildRequestHeaders());
curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false);

//execute post
$result = curl_exec($handle);
$status = curl_getinfo($handle);

if($result === false) {
    echo 'Curl error: ' . curl_error($handle);
} else {
    //echo $status['http_code'];
}


curl_close($handle);
?>
