const loginWith = async (page, username, password) => {
  await page.locator('input[name="Username"]').fill(username)
  await page.locator('input[name="Password"]').fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

export { loginWith }
