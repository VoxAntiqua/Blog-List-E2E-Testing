const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

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

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'adp10390', 'weakpassword')
    })

    test('a new blog can be created', async ({ page }) => {
      //
      await createBlog(
        page,
        'Blog Title',
        'Blog Author',
        'http://www.example.com'
      )
      await expect(
        page.getByText('new blog Blog Title by Blog Author added')
      ).toBeVisible()
      await expect(page.getByText('Blog Title Blog Author')).toBeVisible()
    })

    test('blog can be liked', async ({ page }) => {
      await createBlog(
        page,
        'Blog Title',
        'Blog Author',
        'http://www.example.com'
      )

      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('likes 0')).toBeVisible()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByText('likes 1')).toBeVisible()
    })

    test('blog can be deleted by user who created it', async ({ page }) => {
      await createBlog(
        page,
        'Delete Me',
        'Delete Me Author',
        'http://www.example.com/deleteme'
      )

      await page.getByRole('button', { name: 'view' }).click()
      page.on('dialog', async dialog => await dialog.accept())
      await page.getByRole('button', { name: 'remove' }).click()

      await expect(page.getByText('Delete Me deleted')).toBeVisible()
    })

    test('remove button not visible to other users', async ({
      page,
      request,
    }) => {
      await createBlog(
        page,
        'Delete Me',
        'Delete Me Author',
        'http://www.example.com/deleteme'
      )

      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('remove')).toBeVisible()
      await page.getByRole('button', { name: 'logout' }).click()
      await request.post('http://localhost:3003/api/users', {
        data: {
          name: 'Not Andrew Padgett',
          username: 'voxantiqua',
          password: 'differentpassword',
        },
      })
      await loginWith(page, 'voxantiqua', 'differentpassword')
      await expect(
        page.getByText('Logged in as Not Andrew Padgett')
      ).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('remove')).not.toBeVisible()
    })

    test('blogs are ordered by likes in descending order', async ({ page }) => {
      // create blogs
      await createBlog(
        page,
        'First Blog',
        'Author 1',
        'http://www.example.com/1'
      )
      await createBlog(
        page,
        'Second Blog',
        'Author 2',
        'http://www.example.com/2'
      )
      await createBlog(
        page,
        'Third Blog',
        'Author 3',
        'http://www.example.com/3'
      )

      // wait for all blogs to be visible
      await page.waitForSelector('text=First Blog')
      await page.waitForSelector('text=Second Blog')
      await page.waitForSelector('text=Third Blog')

      // like the second blog twice and the third blog once

      // first, like second blog once and verify
      const secondBlog = page.locator('div.blog', { hasText: 'Second Blog' })
      await secondBlog.getByRole('button', { name: 'view' }).click()
      await secondBlog.getByRole('button', { name: 'like' }).click()
      await expect(secondBlog.locator('.like-count')).toHaveText('1')
      // then like second blog a second time
      await secondBlog.getByRole('button', { name: 'like' }).click()
      await expect(secondBlog.locator('.like-count')).toHaveText('2')

      // like third blog once

      const thirdBlog = page.locator('div.blog', { hasText: 'Third Blog' })
      await thirdBlog.getByRole('button', { name: 'view' }).click()
      await thirdBlog.getByRole('button', { name: 'like' }).click()
      await expect(thirdBlog.locator('.like-count')).toHaveText('1')

      // check the order of blogs
      const blogTitles = await page.locator('.blog-title').allTextContents()
      expect(blogTitles).toEqual(['Second Blog', 'Third Blog', 'First Blog'])

      // verify likes count
      const likeCounts = await page.locator('.like-count').allTextContents()
      const likeCountsNumbers = likeCounts.map(count => parseInt(count))
      expect(likeCountsNumbers).toEqual([2, 1, 0])
    })
  })
})
