async function run() {
  const base = process.env.BASE_URL || 'http://localhost:3000'

  try {
    console.log('Posting a test bank account...')
    const postRes = await fetch(`${base}/api/finance/bank-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountTitle: 'Test Cash Drawer',
        accountNumber: '000-TEST',
        bankName: 'Test Bank',
        branch: 'Main',
        description: 'Created by test script',
        isActive: true
      })
    })

    const postJson = await postRes.json()
    console.log('POST response:', postRes.status, postJson)

    console.log('Fetching bank/cash accounts...')
    const getRes = await fetch(`${base}/api/finance/bank-cash`)
    const getJson = await getRes.json()
    console.log('GET response:', getRes.status, getJson)
  } catch (err) {
    console.error('Test script error:', err)
  }
}

run()
