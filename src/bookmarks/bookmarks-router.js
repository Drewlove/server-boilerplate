const express = require('express')
const { isWebUri } = require('valid-url')
const xss = require('xss')
const logger = require('../logger')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next)=> {
    const {title, url, rating, description} = req.body 
    const newBookmark = {title, url, rating, description}
    for(const [key, value] of Object.entries(newBookmark)){
      if(value == null){
        return res
        .status(400)
        .json({error: {message: `Missing required ${key} in bookmark`}})
      }
    }
    if(!isWebUri(url)){
      logger.error(`${url} is invalid url`)
      return res
      .status(400)
      .json({error: {message: "Invalid URL"}})
    }
    if(!Number.isInteger(rating) || rating < 0 || rating > 5 ){
      logger.error(`Rating of ${rating} given, not a valid rating`)
      return res
      .status(400)
      .json({error: {message: 'Not a valid rating'}})
    }
    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
    .then(bookmark=> {
      res
      .status(201)
      .location(`/bookmarks/${bookmark.id}`)
      .json(serializeBookmark(bookmark))
    })
    .catch(next)
  })


bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next)=> {
    BookmarksService.getById(req.app.get('db'), req.params.bookmark_id)
    .then(bookmark => {
      if(!bookmark){
        logger.error(`Bookmark with `)
        return res
        .status(404)
        .json({error:{message: 'Bookmark not found'}})
      }
      res.bookmark = bookmark
      next()
    })
    .catch(next)
  })
  .delete((req, res, next) => {
    const bookmarkId = req.params.bookmark_id
    BookmarksService.deleteBookmark(req.app.get('db'), bookmarkId)
    .then(()=> {
      logger.info(`Bookmark with id ${bookmarkId} deleted`)
      res.status(204).end()
    })
    .catch(next)
  })

  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark))
  })

module.exports = bookmarksRouter

















