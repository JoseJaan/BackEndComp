import slugify from "slugify";

export default str =>{
    return slugify(str,{
        lower:true,
        replacement: '-',
        remove: /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/g, 
    })
}