//javascript:(function(s){s=document.createElement('script');s.src='https://github.com/antimatter15/fb-grapher/raw/master/dev.js';document.body.appendChild(s)})()

//document.querySelector('.uiMorePager a')
var all_posts_loaded = false;
setInterval(function(){
  //(new Function(document.querySelector('.uiMorePager a').getAttribute('onclick')))()
  var etl = document.querySelector('.empty_wall .status h2');
  if(etl && etl.innerHTML.indexOf('no more posts') != -1){
    scrapeData();
    all_posts_loaded = true
    return;
  }
  
  var evt = document.createEvent("MouseEvents");
  evt.initMouseEvent("click", true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  document.querySelector('.uiMorePager').dispatchEvent(evt);
},4000);

var posts = [];

function scrapeData(){
  var namco = {}; //namecount
  
  var els = document.querySelectorAll('.notification, h6, div div div div[data-ft], abbr[data-date]'); //Hopefully generic selectors that will survive fb theme updates
//  var posts = [];
  for(var i = 0, q = els.length; i < q; i++){
    var el = els[i];
    if(!el){
      //move on...
    }else if(el.getAttribute('data-date')){
      posts.push(new Date(el.getAttribute('data-date')));
    }else if(el.getAttribute('data-ft') && el.getAttribute('data-ft').indexOf('attach') != -1){
      //ignoreh
    }else{
      posts.push(el.innerText);
      for(var els2 = el.querySelectorAll('a[data-hovercard]'), l = els2.length; l--;){
        var name = els2[l].innerText;
        if(!namco[name]) namco[name] = 0;
        namco[name]++;
      }
    }
    el.parentNode.removeChild(el);
  }

  //.replace(/^.+?\s/g,'').indexOf('changed')
  //Names; document.querySelectorAll('a[data-hovercard]')

  var last_time, first_time;
  var groups = {
    "Friend": /now friends/,
    "Comment": /commented on/,
    "Like": /like/,
    "Changed": /changed/,
    "Wall": /wrote on/,
    "Other": /.+/
  };
  var geeky = Object.keys(groups);/*G(roup)KEY*/
  var gct = {};
  var tmp = {};
  var xdata = [];
  var ydata = [];
  var ct = 0;
  for(var k in groups){
    if(!gct[ct]) gct[ct] = 0;
    if(!ydata[ct]) ydata[ct] = [];
    if(!xdata[ct]) xdata[ct] = [];
    ct++;
  }
  for(var i = posts.length; i--; ){
    if(posts[i].getTime){
      if(last_time){
      
        var dnum = Math.round((last_time-first_time)/1000/60/60/24*100)/100;
        if(!isNaN(dnum)){
          var ct = 0;
          for(var k in groups){
            if(tmp[ct]){
              gct[ct] += tmp[ct];
              ydata[ct].push(gct[ct]);
              xdata[ct].push(dnum)
            }
            ct++;
          }
        }
      }
      tmp = {};
      last_time = posts[i]; 
      if(!first_time) first_time = posts[i];
      
    } else if(last_time) {
      var post = posts[i].trim().split('\n')[0].replace(/\xb7.*$/,'').replace(/Remove Post/g,'').trim();
      var ct = 0;
      //console.log(post)
      for(var k in groups){
        if(groups[k].test(post)){

          if(!tmp[ct]) tmp[ct] = 0;
          //console.log(k)
          tmp[ct]++;
          break;
        }
        ct++;
      }
    }
  }
  window.posts = posts;
  window.ydata = ydata;
  window.namco = namco;
  window.geeky = geeky;
  window.xdata = xdata;
}

    
var pad = 50;



function drawCharts(){
    r.clear();

    r.canvas.style.backgroundColor = '#EDEFF4';
    r.canvas.style.borderRadius = '20px';
    r.canvas.style.border = '1px solid #627AAD';
    r.canvas.style.zIndex = 999999;
    r.g.linechart(50, 10, innerWidth - 4 * pad, 480, xdata, ydata, {
      symbol: 'o',
      nostroke: false,
      axis: '0 0 1 1'
    }).hoverColumn(function () {
        this.tags = r.set();
        for (var i = 0, ii = this.y.length; i < ii; i++) {
            this.tags.push(r.g.tag(this.x, this.y[i], geeky[i] + ' '+this.values[i] , 160, 10)
              .insertBefore(this)
              .attr([{fill: "#fff"}, {fill: this.symbols[i].attr("fill")}]));
        }
    }, function () {
        this.tags && this.tags.remove();
    });
    
    var pie = r.g.piechart(380, 130, 100, Object.keys(namco).map(function(i){return namco[i]}), {legend: Object.keys(namco), legendpos: "west"});
    pie.hover(function () {
        this.sector.stop();
        this.sector.scale(1.1, 1.1, this.cx, this.cy);
        if (this.label) {
            this.label[0].stop();
            this.label[0].scale(1.5);
            this.label[1].attr({"font-weight": 800});
        }
    }, function () {
        this.sector.animate({scale: [1, 1, this.cx, this.cy]}, 500, "bounce");
        if (this.label) {
            this.label[0].animate({scale: 1}, 500, "bounce");
            this.label[1].attr({"font-weight": 400});
        }
    });
}


var scripts = [
  'https://github.com/DmitryBaranovskiy/raphael/raw/master/raphael-min.js',
  'http://g.raphaeljs.com/g.raphael.js',
  'https://github.com/DmitryBaranovskiy/g.raphael/blob/master/g.pie-min.js?raw=true',
  'http://g.raphaeljs.com/g.line.js'
];
var next = function(){
  var src = scripts.shift();
  console.log('loading',src);
  if(src){
    var s = document.createElement('script');
    s.src = src;
    s.onload = function(){ next() };
    document.body.appendChild(s);
  }else{ //duhn!
    window.r = Raphael(pad, pad, innerWidth - 2*pad, 500);
    
    setInterval(function(){
    
      if(all_posts_loaded == false){
        scrapeData();
        drawCharts();
      }
    }, 5000)
  }
};
next();

