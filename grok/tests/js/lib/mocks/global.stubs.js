window.NTA = {};

window.GROKUI = {
    msgs: function() {
        return {
            title: 'Test Title',
            site: 'Test Site'
        };
    },
    utils: {
        title: function(t) {
            this._title = t;
        }
    }
};
