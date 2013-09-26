'use strict';
/**
 * Data Store – Abstraction layer to manage data requests
 * and implementa caching layer.
 *
 * TODO: Comment code
 * TODO: Hookup to localStorage if needed...
 * 
 */

define(['_', 'dom'], function (_, $) {

  var DataStore = function (options) {
    var win = window,
        apiUrl = options.apiUrl,
        _fetch,
        _fetchMulti,
        _flush,
        _getCachedData,
        _lookup = {};

    /**
     * Lookup data from multiple cache sources
     * @param  {String} key APi url appension (i.e. `work.json`)
     * @return {Object}     dataset if found
     */
    _getCachedData = function (key, ext) {
      //
      // Look for data in our lookup hash
      //  If NOT found
      //    Lookup on our DOM object
      //  Else If found -> return
      //  

      var res = _lookup[key];

      if (!res) {
        if (ext) {
          return win.rsg_data[key.split(ext)[0]];
        } else {
          return win.rsg_data[key];
        }
      } else {
        return res;
      }

      // return _lookup[key] || win.rsg_data[key.split('.json')[0]];
    };

    /**
     * Fetch dataset (cache || api)
     * @param  {String}   url     api endpoint (i.e. work.json)
     * @param  {Function} cb      Callback to invoke on succes
     * @param  {Object}   context Context in which to invoke callback
     * 
     */
    _fetch = function (url, cb, context) {
      
      var cachedData = _getCachedData(url);//, '.json');

      if (!context) context = null;
      
      //
      // If cached data is found – return it immediately
      // 
      // Else – run ajax operation
      // 
      if (cachedData) {
        // console.log(url + ' – Resolved from cache');
        cb.call(context, cachedData);
      } else {
        $.getJSON(apiUrl + url).then(function (res) {
          _lookup[url] = res;
          // console.log(url + ' – Resolved from API');
          cb.call(context, res);
        });
      }
    };

    /**
     * Fetch multiple json files in parallel
     * @param  {Object}   opts    Pass in a key and [urls]
     *
     * TODO: Use Promises and handle errors/rejections
     */
    _fetchMulti = function (opts, cb, context) {
      var cachedData = _getCachedData(opts.key),
          json = {},
          count = 0;

      function get(url, res) {
        $.getJSON(apiUrl + url).then(res);
      }

      function resolve(data) {
        count++;
        _.extend(json, data);
        if (count === opts.urls.length) cb.call(context, json);
      }

      if (cachedData) {
        // console.log(opts.key + ' – Resolved from cache');
        cb.call(context, cachedData);
      } else {
        _.each(opts.urls, function (url) {
          get(url, resolve);
        });
      }
    };



    /**
     * Flush one or multiple items from `cache`
     * 
     * @param  {Mixed} lookup Can be a String or Array of keys
     * 
     */
    _flush = function (lookup) {

      function _singleFlush(lu) {
        if (_lookup[lu]) _lookup[lu] = null;
      }

      if (lookup) {
        // Empty specific `lookups` from `_lookup` hash
        if (_.isArray(lookup)) {
          _.each(lookup, function (lu) {
            _singleFlush(lu);
          });
        } else {
          _singleFlush(lookup);
        }
      } else {
        // Empty `_lookup` hash
        _lookup = {};
      }
    };

    /**
     * Expose API
     */
    return {
      fetch: _fetch,
      fetchMulti: _fetchMulti,
      flush: _flush
    };

  };

  return DataStore;

});