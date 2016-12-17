--[[
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
]]--

-- This is elastic.lua - ElasticSearch library

local http = require 'socket.http'
local JSON = require 'cjson'
local config = require 'lib/config'
local default_doc = "mbox"

-- http code return check
-- N.B. if the index is closed, ES returns 403, but that may perhaps be true for other conditions
-- ES returns 404 if the index is missing
-- ES also returns 404 if a document is missing
local function checkReturn(code)
    if type(code) == "number" then -- we have a valid HTTP status code
        -- ignore expected return codes here
        -- index returns 201 when an entry is created
        if code ~= 200 and code ~= 201 then
            -- code is called by 2nd-level functions only, so level 4 is the external caller
            error("Backend Database returned code " .. code .. "!", 4)
        end
    else
        error("Could not contact database backend: " .. code .. "!", 4)
    end
end

-- DO common request processing:
-- Encode JSON (as necessary)
-- Issue request
-- Check return code
-- Decode JSON response
--
-- Parameters:
--  - url (required)
--  - query (optional); if this is a table it is decoded into JSON
-- returns decoded JSON result
-- may throw an error if the request fails
--
local function performRequest(url, query) 
    local js = query
    if type(query) == "table" then
        js = JSON.encode(query)
    end
    local result, hc = http.request(url, js)
    checkReturn(hc)
    local json = JSON.decode(result)
    -- TODO should we return the http status code?
    -- This might be necessary if codes such as 404 did not cause an error
    return json
end

-- Standard ES query, returns $size results of any doc of type $doc, sorting by $sitem
local function getHits(query, size, doc, sitem)
    doc = doc or "mbox"
    sitem = sitem or "epoch"
    size = size or 10
    query = query:gsub(" ", "+")
    local url = config.es_url .. doc .. "/_search?q="..query.."&sort=" .. sitem .. ":desc&size=" .. size
    local json = performRequest(url)
    local out = {}
    if json and json.hits and json.hits.hits then
        local hasBody = (doc == "mbox")
        for k, v in pairs(json.hits.hits) do
            v._source.request_id = v._id
            if hasBody and v._source.body == JSON.null then
                v._source.body = ''
            end
            table.insert(out, v._source)
        end
    end
    return out
end

-- Get a single document
local function getDoc (ty, id)
    local url = config.es_url  .. ty .. "/" .. id
    local json = performRequest(url)
    if json and json._source then
        json._source.request_id = json._id
        if ty == "mbox" and json._source.body == JSON.null then
            json._source.body = ''
        end
    end
    return (json and json._source) and json._source or {}
end

-- Get results (a'la getHits), but only return email headers, not the body
-- provides faster transport when we don't need everything
local function getHeaders(query, size, doc)
    doc = doc or "mbox"
    size = size or 10
    query = query:gsub(" ", "+")
    local url = config.es_url  .. doc .. "/_search?_source_exclude=body&q="..query.."&sort=epoch:desc&size=" .. size
    local json = performRequest(url)
    local out = {}
    if json and json.hits and json.hits.hits then
        for k, v in pairs(json.hits.hits) do
            v._source.request_id = v._id
            table.insert(out, v._source)
        end
    end
    return out
end

-- Same as above, but reverse return order
local function getHeadersReverse(query, size, doc)
    doc = doc or "mbox"
    size = size or 10
    query = query:gsub(" ", "+")
    local url = config.es_url .. doc .. "/_search?_source_exclude=body&q="..query.."&sort=epoch:desc&size=" .. size
    local json = performRequest(url)
    local out = {}
    if json and json.hits and json.hits.hits then
        for k, v in pairs(json.hits.hits) do
            v._source.request_id = v._id
            table.insert(out, 1, v._source)
        end
    end
    return out
end

local function contains(table,value)
    if table then
        for _,v in pairs(table) do
            if v == value then return true end
        end
    end
    return false
end

-- Do a raw ES query with a JSON query
local function raw(query, doctype)
    doctype = doctype or default_doc
    local url = config.es_url .. doctype .. "/_search"
    local json = performRequest(url, query)
    if doctype == "mbox" and json and json.hits and json.hits.hits then
        -- Check if the query returns the body attribute
        if contains(query._source, 'body') then
            local dhh = json.hits.hits
            for k = 1, #dhh do
                local v = dhh[k]._source
                if v.body == JSON.null then
                    v.body = ''
                end
            end
        end
    end
    return json or {}, url
end

-- communicate between scan and scroll
local scanHasBody = {}

-- Raw query with scroll/scan
local function scan(query, doctype)
    doctype = doctype or default_doc
    local url = config.es_url .. doctype .. "/_search?search_type=scan&scroll=1m"
    local json = performRequest(url, query)
    if json and json._scroll_id then
        if doctype == "mbox" then
            -- Check if the query returns the body attribute
           if contains(query._source, 'body') then
               -- save the flag for the scroll function (don't bother saving if false)
               scanHasBody[json._scroll_id] = true
           end
        end
        return json._scroll_id
    end
    return nil
end

local function scroll(sid)
    -- We have to do some gsubbing here, as ES expects us to be at the root of the ES URL
    -- But in case we're being proxied, let's just cut off the last part of the URL
    local url = config.es_url:gsub("[^/]+/?$", "") .. "/_search/scroll?scroll=1m&scroll_id=" .. sid
    local json = performRequest(url)
    if json and json._scroll_id then
        if scanHasBody[sid] then
            -- propagate the setting for the next call
            scanHasBody[json._scroll_id] = true
            scanHasBody[sid] = nil -- no longer needed
            local dhh = json.hits.hits
            for k = 1, #dhh do
                local v = dhh[k]._source
                if v.body == JSON.null then
                    v.body = ''
                end
            end
        end
        return json, json._scroll_id
    end
    return nil
end

-- Update a document
local function update(doctype, id, query, consistency)
    doctype = doctype or default_doc
    local url = config.es_url .. doctype .. "/" .. id .. "/_update"
    if consistency then
        url = url .. "?write_consistency=" .. consistency
    end
    local json = performRequest(url, {doc = query })
    return json or {}, url
end

-- Put a new document somewhere
local function index(id, ty, body, consistency)
    if not id then
        error("id parameter must be provided", 3)
    end
    local url = config.es_url .. ty .. "/" .. id
    if consistency then
        url = url .. "?write_consistency=" .. consistency
    end
    local json = performRequest(url, body)
    return json or {}
end

local function setDefault(typ)
    default_doc = typ
end

-- module defs
return {
    find = getHits,
    findFast = getHeaders,
    findFastReverse = getHeadersReverse,
    get = getDoc,
    raw = raw,
    index = index,
    default = setDefault,
    update = update,
    scan = scan,
    scroll = scroll
}