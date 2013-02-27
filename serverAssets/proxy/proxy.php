<?PHP
/**
* A PHP proxy to handle the requests
*
*/

// The URL to fetch is the hostname + path
$url = $_GET['url'];

/**
 * Function buildRequestHeaders 
 * Builds the header for a request
 * @return (array)
 */

function buildRequestHeaders() {
    $headers = array();
    $headerKeys = array('Host', 'Accept', 'Accept-Encoding', 'Accept-Language', 'Content-Length' );
    foreach(getallheaders() as $key => $value) {
        if(!in_array($key, $headerKeys))
            array_push($headers, "$key: $value");
    }
    return $headers;
}

/**
 * Function getPostFields
 * Builds the postfiles as url encoded params
 * @return (string)
 */

function getPostFields() {
    $post_fields = "";
    foreach($_POST as $key=>$value) { $post_fields .= $key.'='.urlencode($value).'&'; }
    return rtrim($post_fields, '&');
}

/**
 * Function generateMultipartFormRequest
 * Builds the multipart form data of a POST request
 * @return (string)
 */
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

/**
 * Function fetchPostContent
 * Fetches the post content based on the request type
 * @return (string)
 */
function fetchPostContent(){
    global $HTTP_RAW_POST_DATA;
    if($_POST){
        return $_FILES ?  generateMultipartFormRequest() :  getPostFields();
    }
    else{
        return $HTTP_RAW_POST_DATA;
    }
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
        curl_setopt($handle, CURLOPT_POSTFIELDS, fetchPostContent());
        break;

    case 'delete':
        curl_setopt($handle, CURLOPT_CUSTOMREQUEST, 'DELETE');
        break;
}

curl_setopt($handle, CURLOPT_HTTPHEADER , buildRequestHeaders());
curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

//execute post
$result = curl_exec($handle);
$status = curl_getinfo ( $handle, CURLINFO_HTTP_CODE );

if($status != 200)
    header($result, true, $status);
echo $result;

if($result === false) {
    echo 'Curl error: ' . curl_error($handle);
} 

curl_close($handle);

?>
