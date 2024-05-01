// ==UserScript==
// @name         CSDN质量分显示按钮
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  用于快速查询编辑页CSDN博客质量分的浏览器脚本，详细描述见https://blog.csdn.net/qq_46106285/article/details/138357755
// @author       shandianchengzi
// @match        https://editor.csdn.net/*
// @match        https://blog.csdn.net/*/article/details/*
// @match        https://*.blog.csdn.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=csdn.net
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL https://update.greasyfork.org/scripts/493863/CSDN%E8%B4%A8%E9%87%8F%E5%88%86%E6%98%BE%E7%A4%BA%E6%8C%89%E9%92%AE.user.js
// @updateURL https://update.greasyfork.org/scripts/493863/CSDN%E8%B4%A8%E9%87%8F%E5%88%86%E6%98%BE%E7%A4%BA%E6%8C%89%E9%92%AE.meta.js
// ==/UserScript==

// 主要配置项 访问 https://blog.csdn.net/qq_46106285/article/details/138357755 查看具体获取方式
var values_info = {
    "CSDN_QC_X-Ca-Key": {
        "hint": "X-Ca-Key",
        "storage_method": "gm"
    },
    "CSDN_QC_X-Ca-Nonce": {
        "hint": "X-Ca-Nonce",
        "storage_method": "gm"
    },
    "CSDN_QC_X-Ca-Signature": {
        "hint": "X-Ca-Signature",
        "storage_method": "gm"
    },
    "CSDN_QC_ID": {
        "hint": "CSDN ID (即个人主页 https://blog.csdn.net/{id} 中的{id})",
        "storage_method": "gm",
        "null_ok_if": "CSDN_QC_DOMAIN_ID"
    },
    "CSDN_QC_DOMAIN_ID": {
        "hint": "CSDN ID (即个人主页 https://{id}.blog.csdn.net 中的{id})",
        "storage_method": "gm",
        "null_ok_if": "CSDN_QC_ID"
    },
}

// return true if value equals to null
function isNull(value){
    let special_null = [null, "null", "", undefined, NaN, "undefined"];
    return special_null.includes(value);
}

function createAButton(element,value,onclick,css,cla="temp"){
    var Button = document.createElement("input");
    Button.type="button";
    Button.value=value;
    Button.onclick=onclick;
    Button.setAttribute("style",css) ;
    Button.setAttribute("class",cla) ;
    element.appendChild(Button);
    return Button;
}

function Toast(msg, duration) {
    duration = isNaN(duration) ? 3000 : duration;
    var m = document.createElement('div');
    m.innerHTML = msg;
    m.style.cssText = "font-family:siyuan;max-width:60%;min-width: 150px;padding:0 14px;height: 40px;color: rgb(255, 255, 255);line-height: 40px;text-align: center;border-radius: 4px;position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);z-index: 999999;background: rgba(0, 0, 0,.7);font-size: 16px;";
    document.body.appendChild(m);
    setTimeout(function() {
        var d = 0.5;
        m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
        m.style.opacity = '0';
        setTimeout(function() {
            document.body.removeChild(m)
        }, d * 1000);
    }, duration);
}

function webQuest(url, method, headers, data, callback) {
    /* url: 请求的 URL
    * method: 请求方法，'GET' 或 'POST'
    * headers: 请求头，一个 dict 对象
    * data: 请求体，一个字符串，形如 'key1=value1&key2=value2'
    * callback: 请求完成后的回调函数，参数是响应的内容
    */
    // 创建一个 XMLHttpRequest 对象
    var xhr = new XMLHttpRequest();

    // 设置请求方法和 URL
    xhr.open(method, url, true);

    // 设置请求头，如果有的话
    for (var key in headers) {
        xhr.setRequestHeader(key, headers[key]);
    }

    // 发送请求
    xhr.send(data);

    // 请求完成后的回调函数
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // 处理响应
            callback(xhr.responseText);
        } else if (xhr.readyState === 4) {
            alert("请求 " + url + " 失败，状态码：" + xhr.status + "，data：" + data);
        }
    };
}

function get_csdn_id(){
    // get csdn_id from href
    let href = window.location.href;
    let id_info = { id: null, id_type: null}
    // get csdn_id from href, eg: https://blog.csdn.net/{id}/article/details/138357755
    id_info.id = href.match(/blog.csdn.net\/(\w+)/);
    id_info.id_type = "CSDN_QC_ID";
    // get csdn_id from href, eg: https://{id}.blog.csdn.net/article/details/138357755
    if (id_info.id == null){
        id_info.id = href.match(/(\w+)\.blog.csdn.net/);
        id_info.id_type = "CSDN_QC_DOMAIN_ID";
    }
    if (id_info.id != null){
        id_info.id = id_info.id[1];
    }
    return id_info;
}

function get_article_id(){
    // get article_id from href
    let href = window.location.href;
    let url = null;
    // get article_id from href, eg: https://editor.csdn.net/md?not_checkout=1&spm=1011.2415.3001.6217&articleId=138357755
    let id = href.match(/articleId=(\d+)/);
    // get article_id from href, eg: https://shandianchengzi.blog.csdn.net/article/details/138357755?spm=1001.2014.3001.5502
    if (id == null){
        id = href.match(/details\/(\d+)/);
    }
    if (id == null){
        return null;
    }
    return id[1];
}

function get_article_url(values_info){
    let id = get_article_id();
    if (isNull(id)){
        alert("请先进入文章页面或编辑页再点击查询！");
        return "no need to fill";
    }
    if (!isNull(values_info["CSDN_QC_ID"]["value"])){
        return "https://blog.csdn.net/" + values_info["CSDN_QC_ID"]["value"] + "/article/details/" + id;
    }
    if (!isNull(values_info["CSDN_QC_DOMAIN_ID"]["value"])){
        return "https://" + values_info["CSDN_QC_DOMAIN_ID"]["value"] + ".blog.csdn.net/article/details/" + id;
    }
    alert("请先配置 CSDN ID 再重新查询！");
    return null;
}

function get_headers(values_info){
    // check if the values are null
    if (isNull(values_info["CSDN_QC_X-Ca-Key"]["value"]) || isNull(values_info["CSDN_QC_X-Ca-Nonce"]["value"]) || isNull(values_info["CSDN_QC_X-Ca-Signature"]["value"])){
        alert("请先配置 X-Ca-Key、X-Ca-Nonce、X-Ca-Signature 再重新查询！");
        return null;
    }
    var headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json, text/plain, */*",
        "X-Ca-Key": values_info["CSDN_QC_X-Ca-Key"]["value"],
        "X-Ca-Nonce": values_info["CSDN_QC_X-Ca-Nonce"]["value"],
        "X-Ca-Signature": values_info["CSDN_QC_X-Ca-Signature"]["value"],
        "X-Ca-Signature-Headers": "x-ca-key,x-ca-nonce",
        "X-Ca-Signed-Content-Type": "multipart/form-data",
    }
    return headers;
}

function questQC(values_info) {
    var url = "https://bizapi.csdn.net/trends/api/v1/get-article-score";
    var method = "POST";
    var callback = function (ret) {
        var response = JSON.parse(ret);
        Toast("质量分: " + response.data.score, 2000);
    }
    let article_url = get_article_url(values_info);
    let headers = get_headers(values_info);
    // check article_url and headers
    if (isNull(article_url) || isNull(headers)){
        fill_values(false, true);
        return;
    }
    // check if the url is start with http
    if (!article_url.startsWith("http")){
        return;
    }
    var data = "url=" + article_url;
    webQuest(url, method, headers, data, callback);
}

function userSetValue(key, hint=null, mode="gm", get_value=true){
    /* key: the key of the value
    * hint: the hint of the value
    * mode: storage or gm, storage: store in local storage, gm: store in GM_setValue
    * get_value: if true, then get value from user, otherwise return the value directly
    * return: the value of the key
    */
    if (hint == null) hint = "请输入" + key + "的值";
    var local_value = null;
    // storage: store in local storage, just used on the current domain
    if (mode == "storage") {
        local_value = localStorage.getItem(key);
    // gm: store in GM_setValue, can be used on all domains
    } else if (mode == "gm") {
        local_value = GM_getValue(key);
    }

    // if need to get value from user, prompt user to input
    if (get_value) {
        // get value from user
        let ret = window.prompt(hint, local_value);
        if (ret != null) {
            if (mode == "storage") {
                localStorage.setItem(key, ret);
            } else if (mode == "gm") {
                GM_setValue(key, ret);
            }
            local_value = ret;
        }
    }

    return local_value;
}

function fill_values(only_fill_null=false, get_value=true){
    for (var key in values_info) {
        var value = values_info[key];
        if (only_fill_null && !isNull(value["value"])) {
            continue;
        }
        if (!isNull(value["null_ok_if"])){
            // if the value is not null, then skip
            if (!isNull(values_info[value["null_ok_if"]]["value"])) {
                continue;
            }
        }
        values_info[key]["value"] = userSetValue(key, value["hint"], value["storage_method"], get_value);
    }
}

function init(){
    // try to get csdn_id from href
    let id_info = get_csdn_id();
    values_info[id_info.id_type]["value"] = id_info.id;
    // fill values but not get value from user
    fill_values(true, false);
}

async function mainFunc(){
    // init headers and csdn_id
    init();
    createAButton(document.body,"质量分查询",function(){questQC(values_info);},
    "height:75px;position:absolute;z-index:999;top:5%;left:1%");
}

(function() {
    'use strict';
    // add mainFunc to onload
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        mainFunc();
    }
    else {
        window.onload = function() {
            oldonload();
            mainFunc();
        }
    }
    // add menu
    GM_registerMenuCommand("参数填写", fill_values.bind(null, false, true));
})();