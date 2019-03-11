module.exports = {
    error: 'Author is not an owner',
    check(msg,args,dj) {
        return dj.dj.get('owners').includes(msg.author.id);
    }
}