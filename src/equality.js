/* exported equality */
/* global isArray */
var equality = (function() {

/**
 * See if two values are equal. Considers -0 and +0 equal as
 * those are hashed by hashInt and there is only one 0 as
 * integer.
 *
 * Doesn't support arrays. If array checks are needed, the hash
 * table should transition into using the slower equals()
 * function.
 *
 * @param {dynamic} key1 Description of key1 parameter.
 * @param {dynamic} key2 Description of key2 parameter.
 * @return {boolean}
 *
 */
function simpleEquals( key1, key2 ) {
                            //fast NaN equality
    return key1 === key2 || (key1 !== key1 && key2 !== key2);
}


/**
 * See if two values are equal. Considers -0 and +0 equal as
 * those are hashed by hashInt and there is only one 0 as
 * integer.
 *
 * Supports non-circular arrays with deep comparison.
 *
 * @param {dynamic} key1 The first key.
 * @param {dynamic} key2 The second key.
 * @return {boolean}
 *
 */
function equals( key1, key2 ) {
    if( isArray( key1 ) &&
        isArray( key2 ) ) {
        if( key1.length === key2.length ) {
            for( var i = 0, len = key1.length; i < len; ++i ) {
                var val1 = key1[i],
                    val2 = key2[i];

                if( !simpleEquals( val1, val2 ) ) {
                    //Skip infinite recursion
                    if( !( val1 === key1 || val1 === key2 ||
                        val2 === key1 || val2 === key1 ) ) {
                        if( !equals( val1, val2 ) ) {
                            return false;
                        }
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }
    return simpleEquals( key1, key2 );
}

return {
    simpleEquals: simpleEquals,
    equals: equals
};
})();
