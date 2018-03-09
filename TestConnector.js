const path = require("path");
const fs   = require("fs");
const md5  = require("md5");
const cp   = require('child_process');

var TestConnector = function()
{
    this.fetch = function(url,options)
    {
        if(TestConnector.test_base_dir == "")
            throw "You need to set TestConnector.test_base_dir to __dirname from inside your test script";

        var fixture_path = TestConnector.fixturePath(TestConnector.test_base_dir,url,options);
        var output = "";

        try
        {
            var output = fs.readFileSync(fixture_path).toString();
        }
        
        catch(e)
        {
            var live_url = url.replace("key=dummy&token=dummy","key="+TestConnector.live_key+"&token="+TestConnector.live_token);
            var cmd      = "curl --request "+options.method+" --url '"+live_url+"'";

            var stdout = cp.execSync(cmd,{stdio: null});
            
            if(stdout)
            {
                fs.writeFileSync(fixture_path,stdout);
                var output = fs.readFileSync(fixture_path).toString();
            }
        }

        if(!output)
        {
            console.log("No test return content for: "+fixture_path);
            console.log(JSON.stringify(options));
            console.log(url);
            console.log("Output: "+output);
        }

        return output;
    }
}

TestConnector.test_base_dir   = "";

TestConnector.fixturePath = function(base_dir,url,options)
{
    var signature =  md5(url+JSON.stringify(options));
    var fixture_path = path.resolve(base_dir,"./trello_api_fixtures/").toString()+"/"+signature;
    return fixture_path;
}
