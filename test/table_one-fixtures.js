function makeItemsArray() {
  return [
{id: 1, first_name:'Jon', age: 32},
{id: 2, first_name: 'Jane', age: 21},
{id: 3, first_name: 'Jimmy', age: 34},
{id: 4, first_name: 'Jeremiah', age: 19}
  ]
}

function makeMaliciousItem() {
  const maliciousItem = {
    id: 100,
    first_name: 'Sally <script>alert("xss");</script>',
    age: 25
  }
  const expectedItem = {
    ...maliciousItem,
    first_name: 'Sally &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
  }
  return {
    maliciousItem,
    expectedItem,
  }
}

module.exports = {
  makeItemsArray,
  makeMaliciousItem,
}
