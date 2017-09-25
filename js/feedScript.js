var getFeed = function(feedName, feedUrl, numEntries)
{
    var url =  'https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feedUrl);

    var serverResponse = $.ajax(
    {
        type: "GET",
        url: url,
        dataType: 'json',
    });

    serverResponse.fail(function()
    {
        console.log("Unable to load " + feedName + ", Incorrect path or invalid feed");
    });

    serverResponse.done(function(data){
        if (data != undefined && data.items != undefined && data.items.length > 0)
        {
            handleData(data.items, feedName, numEntries);
    	}
        else
        {
	       console.log(feedName + " is undefined because it's the worst");
           numFeeds++
        }
    });
};

var handleInstagramData = function(data)
{
    if (data == undefined)
    {
    	numFeeds++;
    	return;
    }

    data = data["data"];
    var xml = [];
    var i;
    var date;
    var numEntries = Math.min(10, data.length);

    for (i = 0; i < numEntries; i++)
    {
        xml[i] = {};
        date = new Date(data[i].created_time *1000);
        xml[i].pubDate  = (date.toGMTString()).replace(/.*?, /, " ");
        xml[i].link = data[i].link;
        
	    // Caption handling
	    if (data[i].caption !== null)
	    {
            data[i].caption.text = data[i].caption.text.replace(/#.*/, "");
	    }
	    else
    	{
	        data[i].caption = {text: ""};
    	}
        
        xml[i].content  = "<img src = '" + data[i].images.standard_resolution.url + "''><p class='caption'>" + data[i].caption.text + "</p>";
        xml[i].title =  "";
    }

    endDataHandling(xml, "instagram", numEntries);
}

var handleData = function(xml, feedName, numEntries)
{
    if (xml == null)
    {
    	numFeeds++;
    	return;
    }

    numEntries = Math.min(numEntries, xml.length);
    console.log(xml);
    var i;

    for (i = 0; i < numEntries && (typeof xml[i] != undefined); i++)
    {
        if (feedName == "fibseq")
        {
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/^[^0-9]*/, "");
            xml[i]["content"] = xml[i]["content"].replace(/^(.|\s)*?<img/m, "<img");
            xml[i]["content"] = xml[i]["content"].replace(/\>(.|\s)*/m, ">");
            xml[i]["content"] = xml[i]["content"] + "<p>" + xml[i]["title"] + "</p>";
            xml[i]["title"] = "";
        }
        else if (feedName == "flickr")
        {
            // Remove first paragraph of 'abethcrane posted a photo'
            xml[i]["content"] = xml[i]["content"].replace(/<p>.*?<\/p>/m, "");
            xml[i]["content"] = xml[i]["content"].replace(/width.*height=".*?" /, "");
            // Remove paragraph and close link from content (we add them in explicitly in the html)
            xml[i]["content"] = xml[i]["content"].replace(/<.?p>/, "");
            xml[i]["content"] = xml[i]["content"].replace(/<\/a>/, "");
            // Swap title into being a caption
            xml[i]["content"] = xml[i]["content"] + "<p class='caption'>" + xml[i]["title"] + "</p></a>";
            xml[i]["title"] = "";
            // Clean up published Date
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/.*?,/, "");
        }
        else if (feedName == "github")
        {
            xml[i]["content"] = xml[i]["title"];
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/.*,/m, "");
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/(:[0-9]{2}):.*/m, "$1");
            xml[i]["title"] =  "";
        }
        else if (feedName == "stackoverflow")
        {
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/^[^0-9]*/, "");
            xml[i]["title"] = xml[i]["title"].replace(/.*?for /, "");
            xml[i]["content"] = xml[i]["contentSnippet"];
        }
        else if (feedName == "twitter")
        {
            img = xml[i]["content"].match(/pic\.twitter\.com[^<]*/);
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/.*,/m, "");
            xml[i]["pubDate"] = xml[i]["pubDate"].replace(/(:[0-9]{2}):.*/m, "$1");
            xml[i]["content"] = xml[i]["content"].replace(/.*<br>/m, "");
            xml[i]["content"] = xml[i]["content"].replace(/(abs.twimg.com\/emoji.*?").*?>/mg, "$1 width='20px'>");
            xml[i]["title"] = "";
        }
    }

    endDataHandling(xml, feedName, i);
}

var endDataHandling = function (xml, feedName, numEntries)
{
    for (i = 0; i < numEntries; i++) {
        xml[i]["name"] = feedName;
        retrievedFeeds.push(xml[i]);
    }

    numFeeds++;
    if (numFeeds == totalFeeds)
    {
        retrievedFeeds.sort(SortByDate);
        getTemplateAjax("templates/feeds.handlebars", "#feeds", retrievedFeeds, displayTemplateAndResizeImages);
    }
}

//This will sort your array
function SortByDate(a, b)
{
    var aDate = new Date(a.pubDate);
    var bDate = new Date(b.pubDate);
    return ((aDate > bDate) ? -1 : ((aDate <= bDate) ? 1 : 0));
}

function feed(feedName, url, count)
{
    this.feedName = feedName;
    this.url = url;
    this.count = count;
}

var numFeeds = 0;
var retrievedFeeds = [];
var feedsToGet = [];
var totalFeeds = 0;

$(document).ready(function() {
    // Instagram is special because their api doesn't give us an rss feed, we just have to work around it
    var insta = new Instafeed({
        get: 'user',
        userId: '34563658',
        accessToken: '34563658.021ea53.d92cf1dfe8c640b5a1b5f69b4783af6d',
        mock: true,
        success: function(data) {handleInstagramData(data);}
    });
    insta.run();

    totalFeeds += 1;

    feedsToGet.push(new feed("flickr", "http://api.flickr.com/services/retrievedFeeds/photos_public.gne?id=105674507@N06", 10));
    feedsToGet.push(new feed("twitter", "https://twitrss.me/twitter_user_to_rss/?user=abethcrane", 10));
    feedsToGet.push(new feed("github", "https://github.com/abethcrane.atom", 10));
    feedsToGet.push(new feed("stackoverflow", "http://stackoverflow.com/retrievedFeeds/user/4629688", 10));
    feedsToGet.push(new feed("fibseq", "http://www.fibonaccisequinsblog.com/feed/", 10));

    totalFeeds += feedsToGet.length;

    for (var i = 0, length = feedsToGet.length; i < length; i++)
    {
        getFeed(feedsToGet[i].feedName, feedsToGet[i].url, feedsToGet[i].count);
    }
});
