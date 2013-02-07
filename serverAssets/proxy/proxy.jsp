<%@page session="false"%>
<%@page import="java.net.*,java.io.*, java.util.*, javax.servlet.*" %>
<%!
public String getParamsContent(HttpServletRequest request) {
  String paramValues= "";
  try{
    for (Enumeration e = request.getParameterNames() ; e.hasMoreElements() ;) {
      String key = e.nextElement().toString();
      String value = request.getParameter(key);
      if(!key.equalsIgnoreCase("url")){
        paramValues = paramValues  + key + "=" + URLEncoder.encode(value, "UTF-8");

      }
    }
  }catch(Exception e){
	
  }
  return paramValues;

}
%>
<%
try {

  String reqUrl = request.getParameter("url");
  String paramValues = getParamsContent(request);

  URL url = new URL(reqUrl);
  HttpURLConnection con = (HttpURLConnection)url.openConnection();

  con.setDoOutput(true);
  con.setRequestMethod(request.getMethod());
  con.setRequestProperty("Content-type", request.getContentType());

  /*Setting the Request Properites from HTTP request */	
  for (Enumeration e = request.getHeaderNames() ; e.hasMoreElements() ;) {
    String key = e.nextElement().toString();
    String value = request.getHeader(key);
    if(!key.equalsIgnoreCase("Accept") && !key.equalsIgnoreCase("Accept-Encoding") && !key.equalsIgnoreCase("Accept-Language") && !key.equalsIgnoreCase("Content-Length") && !key.equalsIgnoreCase("cookie")){
      con.setRequestProperty(key, value);
    }

  }

  int clength = request.getContentLength();
  if(clength > 0) {

    con.setDoInput(true);
    OutputStream os = con.getOutputStream();
    ServletInputStream is = request.getInputStream();

    byte[] buffer = new byte[4096];
    int bytes_read;    // How many bytes in buffer
    while((bytes_read = is.read(buffer)) != -1) {
      os.write(buffer, 0, bytes_read);

    }
    /* Explicitly writing the url encoded  params */
    if(paramValues.length() > 0 ){
      os.write(paramValues.getBytes());
    }
    os.flush();
    os.close();

  }

  response.setContentType(con.getContentType());

  BufferedReader rd = new BufferedReader(new InputStreamReader(con.getInputStream()));
  String line;
  while ((line = rd.readLine()) != null) {
    out.println(line);
  }
  rd.close();

} catch(Exception e) {
  response.setStatus(500);
}
%>
