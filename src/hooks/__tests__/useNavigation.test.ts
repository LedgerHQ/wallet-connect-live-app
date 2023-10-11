import { useNavigation } from "@/hooks/common/useNavigation";
import { Routes } from "@/shared/navigation";

const mockedPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockedPush,
  }),
}));

describe("useNavigation", () => {
  it("should navigate to the specified route with params", () => {
    const { navigate } = useNavigation();
    const route = Routes.SessionProposal;
    const params = { someParam: "value" };

    navigate(route, params);

    expect(mockedPush).toHaveBeenCalledWith({
      pathname: route,
      query: { data: JSON.stringify(params) },
    });
  });

  it("should navigate to the specified route without params", () => {
    const { navigate } = useNavigation();
    const route = Routes.Home;

    navigate(route);

    expect(mockedPush).toHaveBeenCalledWith({
      pathname: route,
      query: { data: JSON.stringify(undefined) }, // No params provided
    });
  });
});
