module.exports = function(error) {
  assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
}
# Change 0 on 2023-11-22
