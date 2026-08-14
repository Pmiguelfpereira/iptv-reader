import { createXtreamClient } from "@/lib/xtream";
import { db } from "../../db";
import { account as accountTable } from "../../db/schema";
import { useAccountStore } from "./account";

jest.mock("../../db", () => ({ db: { select: jest.fn() } }));

jest.mock("@/lib/xtream", () => ({
  createXtreamClient: jest.fn((credentials) => ({ credentials })),
}));

const selectMock = db.select as unknown as jest.Mock;
const createXtreamClientMock = createXtreamClient as jest.Mock;

type Account = NonNullable<
  ReturnType<typeof useAccountStore.getState>["account"]
>;

const ACCOUNT: Account = {
  id: 1,
  url: "http://example.com:8080",
  username: "user",
  password: "pass",
  status: "Active",
};

function mockAccountRows(rows: Account[]) {
  const from = jest.fn(() => rows);
  selectMock.mockReturnValue({ from });
  return from;
}

const INITIAL_STATE = useAccountStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useAccountStore.setState(
    { account: null, client: null, hydrated: false },
    false,
  );
  mockAccountRows([]);
});

afterAll(() => {
  useAccountStore.setState(INITIAL_STATE, true);
});

describe("useAccountStore", () => {
  it("starts with no account, no client and not hydrated", () => {
    const state = useAccountStore.getState();

    expect(state.account).toBeNull();
    expect(state.client).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  describe("hydrate", () => {
    it("loads the stored account and builds the client", async () => {
      const from = mockAccountRows([ACCOUNT]);

      await useAccountStore.getState().hydrate();

      expect(from).toHaveBeenCalledWith(accountTable);
      const state = useAccountStore.getState();
      expect(state.account).toEqual(ACCOUNT);
      expect(state.hydrated).toBe(true);
      expect(createXtreamClientMock).toHaveBeenCalledWith({
        baseUrl: ACCOUNT.url,
        username: ACCOUNT.username,
        password: ACCOUNT.password,
      });
      expect(state.client).toBe(createXtreamClientMock.mock.results[0].value);
    });

    it("marks as hydrated with no account or client when the table is empty", async () => {
      mockAccountRows([]);

      await useAccountStore.getState().hydrate();

      const state = useAccountStore.getState();
      expect(state.account).toBeNull();
      expect(state.client).toBeNull();
      expect(state.hydrated).toBe(true);
      expect(createXtreamClientMock).not.toHaveBeenCalled();
    });

    it("uses only the first row when more than one account exists", async () => {
      const second: Account = { ...ACCOUNT, id: 2, username: "other" };
      mockAccountRows([ACCOUNT, second]);

      await useAccountStore.getState().hydrate();

      expect(useAccountStore.getState().account).toEqual(ACCOUNT);
      expect(createXtreamClientMock).toHaveBeenCalledTimes(1);
      expect(createXtreamClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ username: ACCOUNT.username }),
      );
    });

    it("replaces the previous account and client", async () => {
      const other: Account = {
        ...ACCOUNT,
        id: 9,
        url: "http://other.com",
        username: "new",
        password: "secret",
      };
      useAccountStore.getState().setAccount(ACCOUNT);
      const firstClient = useAccountStore.getState().client;
      mockAccountRows([other]);

      await useAccountStore.getState().hydrate();

      const state = useAccountStore.getState();
      expect(state.account).toEqual(other);
      expect(state.client).not.toBe(firstClient);
      expect(createXtreamClientMock).toHaveBeenLastCalledWith({
        baseUrl: other.url,
        username: other.username,
        password: other.password,
      });
    });

    it("propagates the database error and does not mark as hydrated", async () => {
      selectMock.mockImplementation(() => {
        throw new Error("db offline");
      });

      await expect(useAccountStore.getState().hydrate()).rejects.toThrow(
        "db offline",
      );
      expect(useAccountStore.getState().hydrated).toBe(false);
    });
  });

  describe("setAccount", () => {
    it("stores the account and creates the client with its credentials", () => {
      useAccountStore.getState().setAccount(ACCOUNT);

      const state = useAccountStore.getState();
      expect(state.account).toEqual(ACCOUNT);
      expect(createXtreamClientMock).toHaveBeenCalledWith({
        baseUrl: ACCOUNT.url,
        username: ACCOUNT.username,
        password: ACCOUNT.password,
      });
      expect(state.client).toBe(createXtreamClientMock.mock.results[0].value);
    });

    it("does not read the database or change the hydration flag", () => {
      useAccountStore.setState({ hydrated: true });

      useAccountStore.getState().setAccount(ACCOUNT);

      expect(selectMock).not.toHaveBeenCalled();
      expect(useAccountStore.getState().hydrated).toBe(true);
    });
  });

  describe("clear", () => {
    it("clears the account and the client", () => {
      useAccountStore.getState().setAccount(ACCOUNT);

      useAccountStore.getState().clear();

      const state = useAccountStore.getState();
      expect(state.account).toBeNull();
      expect(state.client).toBeNull();
    });

    it("keeps the hydration state", async () => {
      mockAccountRows([ACCOUNT]);
      await useAccountStore.getState().hydrate();

      useAccountStore.getState().clear();

      expect(useAccountStore.getState().hydrated).toBe(true);
    });
  });

  it("notifies subscribers on every state transition", () => {
    const listener = jest.fn();
    const unsubscribe = useAccountStore.subscribe(listener);

    useAccountStore.getState().setAccount(ACCOUNT);
    useAccountStore.getState().clear();
    unsubscribe();
    useAccountStore.getState().setAccount(ACCOUNT);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
