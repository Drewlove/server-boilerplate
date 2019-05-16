TRUNCATE bookmarks; 

serializeBookmarks = bookmark => ({
    title: bookmark.title,
})

router
.route('/bookmarks')
.get((req, res, next) => {
    bookmarksService.getAllBookmarks(req.app.get('app'))
    .status(400)
    .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmarks))
    })
    .catch(next)
})