using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web;

namespace TestApp
{
    public class SocialProxy : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            HttpResponse response = context.Response;

            // Check for query string
            string uri = Uri.UnescapeDataString(context.Request.QueryString[0].ToString());
            if (string.IsNullOrWhiteSpace(uri))
            {
                response.StatusCode = 403;
                response.End();
                return;
            }

            // Create web request
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(new Uri(uri));
            request.Method = context.Request.HttpMethod;
            string[] restrictedHeaders = new string[] { "Accept", "Connection", "Content-Length", "Content-Type", "Expect", "Date", "Host", "If-Modified-Since", "Range", "Referer", "Transfer-Encoding", "User-Agent", "Accept-Encoding", "Accept-Language" };
            //request.Headers = (WebHeaderCollection)context.Request.Headers;
            foreach(String name in context.Request.Headers.AllKeys){
                if(!Array.Exists(restrictedHeaders, s => s.Equals(name)))
                  request.Headers.Add(name, context.Request.Headers[name]);  
            }
            switch (context.Request.HttpMethod.ToLower())
            {
              case "get":
                    break;
              case "post":
                    request.ContentType = context.Request.ContentType;
                    Stream reader = context.Request.InputStream;
                    byte[] postData = new byte[reader.Length];
                    int n = reader.Read(postData, 0, (int)reader.Length);
                    request.ContentLength = postData.Length;
                    Stream writer = request.GetRequestStream();
                    writer.Write(postData, 0, postData.Length);
                    writer.Close();
                    break;
            }

           
            
            


            // Send the request to the server
            //WebResponse serverResponse = null;
            HttpWebResponse serverResponse = null;
            try
            {
                //serverResponse = webRequest.GetResponse();
                serverResponse = (HttpWebResponse)request.GetResponse();

            }
            catch (WebException webExc)
            {
                response.StatusCode = 500;
                response.StatusDescription = webExc.Status.ToString();
                response.Write(webExc.Response);
                response.End();
                return;
            }

            // Exit if invalid response
            if (serverResponse == null)
            {
                response.End();
                return;
            }

                // Configure reponse
                response.ContentType = serverResponse.ContentType;
                Stream stream = serverResponse.GetResponseStream();

                byte[] buffer = new byte[32768];
                int read = 0;

                int chunk;
                while ((chunk = stream.Read(buffer, read, buffer.Length - read)) > 0)
                {
                    read += chunk;
                    if (read != buffer.Length) { continue; }
                    int nextByte = stream.ReadByte();
                    if (nextByte == -1) { break; }

                    // Resize the buffer
                    byte[] newBuffer = new byte[buffer.Length * 2];
                    Array.Copy(buffer, newBuffer, buffer.Length);
                    newBuffer[read] = (byte)nextByte;
                    buffer = newBuffer;
                    read++;
                }

                // Buffer is now too big. Shrink it.
                byte[] ret = new byte[read];
                Array.Copy(buffer, ret, read);

                response.OutputStream.Write(ret, 0, ret.Length);
                serverResponse.Close();
                stream.Close();
                response.End();
        }
        public bool IsReusable
        {
            get { return false; }
        }
    }
}