const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Andrew Padgett',
        username: 'adp10390',
        password: 'weakpassword',
      },
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('log in to application')).toBeVisible()
    await expect(page.getByText('username')).toBeVisible()
    await expect(page.getByText('password')).toBeVisible()
    await expect(page.getByText('login')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'adp10390', 'weakpassword')
      await expect(page.getByText('Logged in as Andrew Padgett')).toBeVisible()
      await expect(page.getByText('Andrew Padgett logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'adp10390', 'wrongpassword')
      await expect(page.getByText('Wrong username or password')).toBeVisible()
      await expect(page.getByText('Andrew Padgett logged in')).not.toBeVisible()
    })
  })
})
